from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_patient_or_404
from app.models.dental_note import DentalNote
from app.schemas.dental_note import DentalNoteCreate, DentalNoteUpdate, ToothChartEntry


class DentalNoteService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, clinic_id: int, patient_id: int | None = None) -> list[DentalNote]:
        query = select(DentalNote).where(DentalNote.clinic_id == clinic_id)
        if patient_id is not None:
            query = query.where(DentalNote.patient_id == patient_id)
        result = await self.db.execute(
            query.order_by(DentalNote.note_date.desc(), DentalNote.created_at.desc())
        )
        return list(result.scalars().all())

    async def get(self, clinic_id: int, note_id: int) -> DentalNote:
        result = await self.db.execute(
            select(DentalNote).where(DentalNote.id == note_id, DentalNote.clinic_id == clinic_id)
        )
        note = result.scalar_one_or_none()
        if note is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Dental note not found")
        return note

    async def create(self, clinic_id: int, data: DentalNoteCreate) -> list[DentalNote]:
        """Creates one DentalNote row per selected tooth (tooth_numbers takes
        precedence; falls back to the single tooth_number field, or a single
        tooth-less note if neither is set)."""
        await get_patient_or_404(data.patient_id, clinic_id, self.db)

        payload = data.model_dump(exclude={"tooth_number", "tooth_numbers", "procedure_ids"})
        payload["procedure_ids"] = (
            ",".join(str(p) for p in data.procedure_ids) if data.procedure_ids else None
        )
        teeth = data.tooth_numbers if data.tooth_numbers else (
            [data.tooth_number] if data.tooth_number is not None else [None]
        )

        notes = [
            DentalNote(clinic_id=clinic_id, tooth_number=tooth, **payload) for tooth in teeth
        ]
        self.db.add_all(notes)
        await self.db.commit()
        for note in notes:
            await self.db.refresh(note)
        return notes

    async def update(self, clinic_id: int, note_id: int, data: DentalNoteUpdate) -> DentalNote:
        note = await self.get(clinic_id, note_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            if field == "procedure_ids":
                value = ",".join(str(p) for p in value) if value else None
            setattr(note, field, value)
        await self.db.commit()
        await self.db.refresh(note)
        return note

    async def delete(self, clinic_id: int, note_id: int) -> None:
        note = await self.get(clinic_id, note_id)
        await self.db.delete(note)
        await self.db.commit()

    async def chart(
        self, clinic_id: int, patient_id: int, dentition: str | None = None
    ) -> list[ToothChartEntry]:
        """Latest condition per tooth for this patient, derived from notes
        that have both a tooth_number and a condition set. tooth_number is
        only unique within a dentition (adult vs pediatric use overlapping
        ranges), so entries are grouped by (dentition, tooth_number)."""
        await get_patient_or_404(patient_id, clinic_id, self.db)

        query = select(DentalNote).where(
            DentalNote.clinic_id == clinic_id,
            DentalNote.patient_id == patient_id,
            DentalNote.tooth_number.is_not(None),
            DentalNote.condition.is_not(None),
        )
        if dentition is not None:
            query = query.where(DentalNote.dentition == dentition)
        result = await self.db.execute(
            query.order_by(DentalNote.note_date.desc(), DentalNote.created_at.desc())
        )
        notes = result.scalars().all()

        latest_by_tooth: dict[tuple[str, int], DentalNote] = {}
        for note in notes:
            key = (note.dentition, note.tooth_number)
            if key not in latest_by_tooth:
                latest_by_tooth[key] = note

        return [
            ToothChartEntry(
                dentition=key[0],
                tooth_number=key[1],
                condition=note.condition,
                note_id=note.id,
                note_date=note.note_date,
            )
            for key, note in sorted(latest_by_tooth.items())
        ]
