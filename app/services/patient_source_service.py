from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient_source import PatientSource
from app.schemas.patient_source import PatientSourceCreate, PatientSourceUpdate


class PatientSourceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, clinic_id: int) -> list[PatientSource]:
        result = await self.db.execute(
            select(PatientSource)
            .where(PatientSource.clinic_id == clinic_id)
            .order_by(PatientSource.name)
        )
        return list(result.scalars().all())

    async def get(self, clinic_id: int, source_id: int) -> PatientSource:
        result = await self.db.execute(
            select(PatientSource).where(
                PatientSource.id == source_id, PatientSource.clinic_id == clinic_id
            )
        )
        source = result.scalar_one_or_none()
        if source is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient source not found")
        return source

    async def create(self, clinic_id: int, data: PatientSourceCreate) -> PatientSource:
        source = PatientSource(clinic_id=clinic_id, **data.model_dump())
        self.db.add(source)
        await self.db.commit()
        await self.db.refresh(source)
        return source

    async def update(self, clinic_id: int, source_id: int, data: PatientSourceUpdate) -> PatientSource:
        source = await self.get(clinic_id, source_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(source, field, value)
        await self.db.commit()
        await self.db.refresh(source)
        return source

    async def delete(self, clinic_id: int, source_id: int) -> None:
        source = await self.get(clinic_id, source_id)
        source.is_active = False
        await self.db.commit()
