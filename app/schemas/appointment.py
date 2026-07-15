from datetime import datetime

from pydantic import BaseModel

from app.models.appointment import AppointmentRequestStatus, AppointmentStatus


class AppointmentBase(BaseModel):
    patient_id: int
    provider_id: int | None = None
    start_time: datetime
    end_time: datetime
    appointment_type: str | None = None
    notes: str | None = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    provider_id: int | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    appointment_type: str | None = None
    status: AppointmentStatus | None = None
    notes: str | None = None


class AppointmentOut(AppointmentBase):
    id: int
    clinic_id: int
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AppointmentRequestCreate(BaseModel):
    patient_id: int
    requested_start: datetime
    requested_end: datetime | None = None
    note: str | None = None


class AppointmentRequestOut(BaseModel):
    id: int
    clinic_id: int
    patient_id: int
    requested_start: datetime
    requested_end: datetime | None
    note: str | None
    status: AppointmentRequestStatus
    resulting_appointment_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AppointmentRequestDecline(BaseModel):
    reason: str | None = None
