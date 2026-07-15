from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.drug import Drug
from app.schemas.drug import DrugCreate, DrugUpdate


class DrugService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, clinic_id: int) -> list[Drug]:
        result = await self.db.execute(
            select(Drug).where(Drug.clinic_id == clinic_id).order_by(Drug.name)
        )
        return list(result.scalars().all())

    async def get(self, clinic_id: int, drug_id: int) -> Drug:
        result = await self.db.execute(
            select(Drug).where(Drug.id == drug_id, Drug.clinic_id == clinic_id)
        )
        drug = result.scalar_one_or_none()
        if drug is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Drug not found")
        return drug

    async def create(self, clinic_id: int, data: DrugCreate) -> Drug:
        drug = Drug(clinic_id=clinic_id, **data.model_dump())
        self.db.add(drug)
        await self.db.commit()
        await self.db.refresh(drug)
        return drug

    async def update(self, clinic_id: int, drug_id: int, data: DrugUpdate) -> Drug:
        drug = await self.get(clinic_id, drug_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(drug, field, value)
        await self.db.commit()
        await self.db.refresh(drug)
        return drug

    async def delete(self, clinic_id: int, drug_id: int) -> None:
        drug = await self.get(clinic_id, drug_id)
        drug.is_active = False
        await self.db.commit()
