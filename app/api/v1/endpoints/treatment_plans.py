from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.treatment_plan import TreatmentPlan
from app.models.user import User
from app.schemas.treatment_plan import (
    TreatmentPlanCreate,
    TreatmentPlanItemCreate,
    TreatmentPlanItemUpdate,
    TreatmentPlanOut,
    TreatmentPlanUpdate,
)
from app.services.treatment_plan_service import TreatmentPlanService

router = APIRouter(prefix="/clinic", tags=["treatment-plans"])


@router.get("/patients/treatment-plans/", response_model=list[TreatmentPlanOut])
async def list_treatment_plans(
    patient_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TreatmentPlan]:
    return await TreatmentPlanService(db).list(current_user.clinic_id, patient_id)


@router.post(
    "/patients/treatment-plans/",
    response_model=TreatmentPlanOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_treatment_plan(
    data: TreatmentPlanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TreatmentPlan:
    return await TreatmentPlanService(db).create(current_user.clinic_id, data)


@router.get("/treatment-plans/{plan_id}", response_model=TreatmentPlanOut)
async def get_treatment_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TreatmentPlan:
    return await TreatmentPlanService(db).get(current_user.clinic_id, plan_id)


@router.patch("/treatment-plans/{plan_id}", response_model=TreatmentPlanOut)
async def update_treatment_plan(
    plan_id: int,
    data: TreatmentPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TreatmentPlan:
    return await TreatmentPlanService(db).update(current_user.clinic_id, plan_id, data)


@router.post("/treatment-plans/{plan_id}/accept", response_model=TreatmentPlanOut)
async def accept_treatment_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TreatmentPlan:
    return await TreatmentPlanService(db).accept(current_user.clinic_id, plan_id)


@router.delete("/treatment-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_treatment_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await TreatmentPlanService(db).delete(current_user.clinic_id, plan_id)


@router.post("/treatment-plans/{plan_id}/items", response_model=TreatmentPlanOut)
async def add_treatment_plan_item(
    plan_id: int,
    data: TreatmentPlanItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TreatmentPlan:
    return await TreatmentPlanService(db).add_item(current_user.clinic_id, plan_id, data)


@router.patch("/treatment-plans/{plan_id}/items/{item_id}", response_model=TreatmentPlanOut)
async def update_treatment_plan_item(
    plan_id: int,
    item_id: int,
    data: TreatmentPlanItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TreatmentPlan:
    return await TreatmentPlanService(db).update_item(current_user.clinic_id, plan_id, item_id, data)
