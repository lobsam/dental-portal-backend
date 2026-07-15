from datetime import datetime

from pydantic import BaseModel

from app.models.treatment_plan import TreatmentPlanItemStatus, TreatmentPlanStatus


class TreatmentPlanItemBase(BaseModel):
    procedure_id: int | None = None
    tooth_number: str | None = None
    description: str | None = None
    cost: float | None = None


class TreatmentPlanItemCreate(TreatmentPlanItemBase):
    pass


class TreatmentPlanItemUpdate(BaseModel):
    procedure_id: int | None = None
    tooth_number: str | None = None
    description: str | None = None
    cost: float | None = None
    status: TreatmentPlanItemStatus | None = None


class TreatmentPlanItemOut(TreatmentPlanItemBase):
    id: int
    treatment_plan_id: int
    status: TreatmentPlanItemStatus

    model_config = {"from_attributes": True}


class TreatmentPlanCreate(BaseModel):
    patient_id: int
    provider_id: int | None = None
    notes: str | None = None
    items: list[TreatmentPlanItemCreate] = []


class TreatmentPlanUpdate(BaseModel):
    provider_id: int | None = None
    status: TreatmentPlanStatus | None = None
    notes: str | None = None


class TreatmentPlanOut(BaseModel):
    id: int
    clinic_id: int
    patient_id: int
    provider_id: int | None
    status: TreatmentPlanStatus
    notes: str | None
    created_at: datetime
    updated_at: datetime
    items: list[TreatmentPlanItemOut] = []

    model_config = {"from_attributes": True}
