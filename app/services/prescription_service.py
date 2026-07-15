from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_patient_or_404
from app.models.prescription import Prescription, PrescriptionItem
from app.schemas.prescription import PrescriptionCreate


class PrescriptionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, clinic_id: int, patient_id: int | None = None) -> list[Prescription]:
        query = (
            select(Prescription)
            .where(Prescription.clinic_id == clinic_id)
            .options(selectinload(Prescription.items))
            .execution_options(populate_existing=True)
        )
        if patient_id is not None:
            query = query.where(Prescription.patient_id == patient_id)
        result = await self.db.execute(query.order_by(Prescription.issued_at.desc()))
        return list(result.scalars().unique().all())

    async def get(self, clinic_id: int, prescription_id: int) -> Prescription:
        result = await self.db.execute(
            select(Prescription)
            .where(Prescription.id == prescription_id, Prescription.clinic_id == clinic_id)
            .options(selectinload(Prescription.items))
            .execution_options(populate_existing=True)
        )
        prescription = result.scalar_one_or_none()
        if prescription is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Prescription not found")
        return prescription

    async def create(self, clinic_id: int, data: PrescriptionCreate) -> Prescription:
        await get_patient_or_404(data.patient_id, clinic_id, self.db)

        prescription = Prescription(
            clinic_id=clinic_id,
            patient_id=data.patient_id,
            provider_id=data.provider_id,
            notes=data.notes,
        )
        for item in data.items:
            prescription.items.append(PrescriptionItem(**item.model_dump()))

        self.db.add(prescription)
        await self.db.commit()
        return await self.get(clinic_id, prescription.id)
