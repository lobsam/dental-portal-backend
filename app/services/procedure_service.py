from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.procedure import Procedure
from app.schemas.procedure import ProcedureCreate, ProcedureUpdate


class ProcedureService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, clinic_id: int) -> list[Procedure]:
        result = await self.db.execute(
            select(Procedure).where(Procedure.clinic_id == clinic_id).order_by(Procedure.name)
        )
        return list(result.scalars().all())

    async def get(self, clinic_id: int, procedure_id: int) -> Procedure:
        result = await self.db.execute(
            select(Procedure).where(Procedure.id == procedure_id, Procedure.clinic_id == clinic_id)
        )
        procedure = result.scalar_one_or_none()
        if procedure is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Procedure not found")
        return procedure

    async def create(self, clinic_id: int, data: ProcedureCreate) -> Procedure:
        procedure = Procedure(clinic_id=clinic_id, **data.model_dump())
        self.db.add(procedure)
        await self.db.commit()
        await self.db.refresh(procedure)
        return procedure

    async def update(self, clinic_id: int, procedure_id: int, data: ProcedureUpdate) -> Procedure:
        procedure = await self.get(clinic_id, procedure_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(procedure, field, value)
        await self.db.commit()
        await self.db.refresh(procedure)
        return procedure

    async def delete(self, clinic_id: int, procedure_id: int) -> None:
        procedure = await self.get(clinic_id, procedure_id)
        procedure.is_active = False
        await self.db.commit()
