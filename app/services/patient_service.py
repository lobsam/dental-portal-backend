from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate


class PatientService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, clinic_id: int, search: str | None = None) -> list[Patient]:
        query = select(Patient).where(Patient.clinic_id == clinic_id)
        if search:
            like = f"%{search.lower()}%"
            query = query.where(
                (Patient.first_name.ilike(like))
                | (Patient.last_name.ilike(like))
                | (Patient.email.ilike(like))
                | (Patient.phone.ilike(like))
            )
        result = await self.db.execute(query.order_by(Patient.last_name, Patient.first_name))
        return list(result.scalars().all())

    async def get(self, clinic_id: int, patient_id: int) -> Patient:
        result = await self.db.execute(
            select(Patient).where(Patient.id == patient_id, Patient.clinic_id == clinic_id)
        )
        patient = result.scalar_one_or_none()
        if patient is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
        return patient

    async def create(self, clinic_id: int, data: PatientCreate) -> Patient:
        patient = Patient(clinic_id=clinic_id, **data.model_dump())
        self.db.add(patient)
        await self.db.commit()
        await self.db.refresh(patient)
        return patient

    async def update(self, clinic_id: int, patient_id: int, data: PatientUpdate) -> Patient:
        patient = await self.get(clinic_id, patient_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(patient, field, value)
        await self.db.commit()
        await self.db.refresh(patient)
        return patient

    async def archive(self, clinic_id: int, patient_id: int) -> None:
        patient = await self.get(clinic_id, patient_id)
        patient.is_active = False
        await self.db.commit()
