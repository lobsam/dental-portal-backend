from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.appointment import (
    Appointment,
    AppointmentRequest,
    AppointmentRequestStatus,
    AppointmentStatus,
)
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentOut,
    AppointmentRequestCreate,
    AppointmentRequestDecline,
    AppointmentRequestOut,
    AppointmentUpdate,
)
from app.services.appointment_service import AppointmentService

router = APIRouter(prefix="/clinic", tags=["appointments"])


# --- Appointment requests (must be declared before /patients/appointments
# for readability; distinct path so no collision) ---------------------------


@router.get("/appointment-requests/", response_model=list[AppointmentRequestOut])
async def list_appointment_requests(
    status_filter: AppointmentRequestStatus | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AppointmentRequest]:
    return await AppointmentService(db).list_requests(current_user.clinic_id, status_filter)


@router.post(
    "/appointment-requests/",
    response_model=AppointmentRequestOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_appointment_request(
    data: AppointmentRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AppointmentRequest:
    return await AppointmentService(db).create_request(current_user.clinic_id, data)


@router.post("/appointment-requests/{request_id}/confirm", response_model=AppointmentOut)
async def confirm_appointment_request(
    request_id: int,
    provider_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Appointment:
    return await AppointmentService(db).confirm_request(current_user.clinic_id, request_id, provider_id)


@router.post("/appointment-requests/{request_id}/decline", response_model=AppointmentRequestOut)
async def decline_appointment_request(
    request_id: int,
    data: AppointmentRequestDecline,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AppointmentRequest:
    return await AppointmentService(db).decline_request(current_user.clinic_id, request_id, data.reason)


# --- Appointments -----------------------------------------------------------


@router.get("/patients/appointments/", response_model=list[AppointmentOut])
async def list_appointments(
    patient_id: int | None = None,
    provider_id: int | None = None,
    status_filter: AppointmentStatus | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Appointment]:
    return await AppointmentService(db).list(
        current_user.clinic_id, patient_id, provider_id, status_filter
    )


@router.post(
    "/patients/appointments/",
    response_model=AppointmentOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_appointment(
    data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Appointment:
    return await AppointmentService(db).create(current_user.clinic_id, data)


@router.get("/appointments/{appointment_id}", response_model=AppointmentOut)
async def get_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Appointment:
    return await AppointmentService(db).get(current_user.clinic_id, appointment_id)


@router.patch("/appointments/{appointment_id}", response_model=AppointmentOut)
async def update_appointment(
    appointment_id: int,
    data: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Appointment:
    return await AppointmentService(db).update(current_user.clinic_id, appointment_id, data)


@router.post("/appointments/{appointment_id}/approve", response_model=AppointmentOut)
async def approve_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Appointment:
    return await AppointmentService(db).approve(current_user.clinic_id, appointment_id)


@router.post("/appointments/{appointment_id}/reject", response_model=AppointmentOut)
async def reject_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Appointment:
    return await AppointmentService(db).reject(current_user.clinic_id, appointment_id)
