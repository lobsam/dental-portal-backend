from datetime import datetime

from pydantic import BaseModel


class PrescriptionItemBase(BaseModel):
    drug_id: int | None = None
    drug_name: str
    dosage: str | None = None
    frequency: str | None = None
    duration: str | None = None
    instructions: str | None = None


class PrescriptionItemOut(PrescriptionItemBase):
    id: int
    prescription_id: int

    model_config = {"from_attributes": True}


class PrescriptionCreate(BaseModel):
    patient_id: int
    provider_id: int | None = None
    notes: str | None = None
    items: list[PrescriptionItemBase] = []


class PrescriptionOut(BaseModel):
    id: int
    clinic_id: int
    patient_id: int
    provider_id: int | None
    issued_at: datetime
    notes: str | None
    items: list[PrescriptionItemOut] = []

    model_config = {"from_attributes": True}
