from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_patient_or_404
from app.models.treatment_plan import TreatmentPlan, TreatmentPlanItem, TreatmentPlanStatus
from app.schemas.treatment_plan import (
    TreatmentPlanCreate,
    TreatmentPlanItemCreate,
    TreatmentPlanItemUpdate,
    TreatmentPlanUpdate,
)


class TreatmentPlanService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, clinic_id: int, patient_id: int | None = None) -> list[TreatmentPlan]:
        query = (
            select(TreatmentPlan)
            .where(TreatmentPlan.clinic_id == clinic_id)
            .options(selectinload(TreatmentPlan.items))
            .execution_options(populate_existing=True)
        )
        if patient_id is not None:
            query = query.where(TreatmentPlan.patient_id == patient_id)
        result = await self.db.execute(query.order_by(TreatmentPlan.created_at.desc()))
        return list(result.scalars().unique().all())

    async def get(self, clinic_id: int, plan_id: int) -> TreatmentPlan:
        # populate_existing forces already-identity-mapped instances (and their
        # relationship collections) to be refreshed from this query, instead of
        # returning stale cached state -- matters because expire_on_commit=False.
        result = await self.db.execute(
            select(TreatmentPlan)
            .where(TreatmentPlan.id == plan_id, TreatmentPlan.clinic_id == clinic_id)
            .options(selectinload(TreatmentPlan.items))
            .execution_options(populate_existing=True)
        )
        plan = result.scalar_one_or_none()
        if plan is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Treatment plan not found")
        return plan

    async def create(self, clinic_id: int, data: TreatmentPlanCreate) -> TreatmentPlan:
        await get_patient_or_404(data.patient_id, clinic_id, self.db)

        plan = TreatmentPlan(
            clinic_id=clinic_id,
            patient_id=data.patient_id,
            provider_id=data.provider_id,
            notes=data.notes,
        )
        for item in data.items:
            plan.items.append(TreatmentPlanItem(**item.model_dump()))

        self.db.add(plan)
        await self.db.commit()
        return await self.get(clinic_id, plan.id)

    async def update(self, clinic_id: int, plan_id: int, data: TreatmentPlanUpdate) -> TreatmentPlan:
        plan = await self.get(clinic_id, plan_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(plan, field, value)
        await self.db.commit()
        return await self.get(clinic_id, plan_id)

    async def accept(self, clinic_id: int, plan_id: int) -> TreatmentPlan:
        plan = await self.get(clinic_id, plan_id)
        plan.status = TreatmentPlanStatus.ACCEPTED
        await self.db.commit()
        return await self.get(clinic_id, plan_id)

    async def add_item(
        self, clinic_id: int, plan_id: int, data: TreatmentPlanItemCreate
    ) -> TreatmentPlan:
        plan = await self.get(clinic_id, plan_id)
        item = TreatmentPlanItem(treatment_plan_id=plan.id, **data.model_dump())
        self.db.add(item)
        await self.db.commit()
        return await self.get(clinic_id, plan_id)

    async def update_item(
        self, clinic_id: int, plan_id: int, item_id: int, data: TreatmentPlanItemUpdate
    ) -> TreatmentPlan:
        await self.get(clinic_id, plan_id)  # ensures plan belongs to clinic
        result = await self.db.execute(
            select(TreatmentPlanItem).where(
                TreatmentPlanItem.id == item_id, TreatmentPlanItem.treatment_plan_id == plan_id
            )
        )
        item = result.scalar_one_or_none()
        if item is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Treatment plan item not found")

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        await self.db.commit()
        return await self.get(clinic_id, plan_id)
