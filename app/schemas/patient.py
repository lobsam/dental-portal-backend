from datetime import date, datetime

from pydantic import BaseModel


class PatientBase(BaseModel):
    # Identity
    patient_code: str | None = None
    first_name: str
    middle_name: str | None = None
    last_name: str
    suffix: str | None = None
    nickname: str | None = None

    gender: str | None = None
    email: str | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    address: str | None = None
    job_title: str | None = None

    height: float | None = None
    weight: float | None = None

    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    recall_date: date | None = None

    has_allergies: bool = False
    allergies: str | None = None

    patient_source_id: int | None = None
    photo_url: str | None = None
    notes: str | None = None
    dentition: str | None = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    patient_code: str | None = None
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    suffix: str | None = None
    nickname: str | None = None
    gender: str | None = None
    email: str | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    address: str | None = None
    job_title: str | None = None
    height: float | None = None
    weight: float | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    recall_date: date | None = None
    has_allergies: bool | None = None
    allergies: str | None = None
    patient_source_id: int | None = None
    photo_url: str | None = None
    notes: str | None = None
    is_active: bool | None = None
    dentition: str | None = None


class PatientOut(PatientBase):
    id: int
    clinic_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
