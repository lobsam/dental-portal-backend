from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_patient_or_404
from app.models.appointment import (
    Appointment,
    AppointmentRequest,
    AppointmentRequestStatus,
    AppointmentStatus,
)
from app.schemas.appointment import AppointmentCreate, AppointmentRequestCreate, AppointmentUpdate


class AppointmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Appointments -----------------------------------------------------

    async def list(
        self,
        clinic_id: int,
        patient_id: int | None = None,
        provider_id: int | None = None,
        status_filter: AppointmentStatus | None = None,
    ) -> list[Appointment]:
        query = select(Appointment).where(Appointment.clinic_id == clinic_id)
        if patient_id is not None:
            query = query.where(Appointment.patient_id == patient_id)
        if provider_id is not None:
            query = query.where(Appointment.provider_id == provider_id)
        if status_filter is not None:
            query = query.where(Appointment.status == status_filter)
        result = await self.db.execute(query.order_by(Appointment.start_time))
        return list(result.scalars().all())

    async def get(self, clinic_id: int, appointment_id: int) -> Appointment:
        result = await self.db.execute(
            select(Appointment).where(
                Appointment.id == appointment_id, Appointment.clinic_id == clinic_id
            )
        )
        appointment = result.scalar_one_or_none()
        if appointment is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")
        return appointment

    async def create(self, clinic_id: int, data: AppointmentCreate) -> Appointment:
        await get_patient_or_404(data.patient_id, clinic_id, self.db)
        if data.end_time <= data.start_time:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "end_time must be after start_time")

        appointment = Appointment(clinic_id=clinic_id, **data.model_dump())
        self.db.add(appointment)
        await self.db.commit()
        await self.db.refresh(appointment)
        return appointment

    async def update(self, clinic_id: int, appointment_id: int, data: AppointmentUpdate) -> Appointment:
        appointment = await self.get(clinic_id, appointment_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(appointment, field, value)
        await self.db.commit()
        await self.db.refresh(appointment)
        return appointment

    async def cancel(self, clinic_id: int, appointment_id: int) -> Appointment:
        appointment = await self.get(clinic_id, appointment_id)
        appointment.status = AppointmentStatus.CANCELLED
        await self.db.commit()
        await self.db.refresh(appointment)
        return appointment

    async def check_in(self, clinic_id: int, appointment_id: int) -> Appointment:
        appointment = await self.get(clinic_id, appointment_id)
        appointment.status = AppointmentStatus.CHECKED_IN
        await self.db.commit()
        await self.db.refresh(appointment)
        return appointment

    async def complete(self, clinic_id: int, appointment_id: int) -> Appointment:
        appointment = await self.get(clinic_id, appointment_id)
        appointment.status = AppointmentStatus.COMPLETED
        await self.db.commit()
        await self.db.refresh(appointment)
        return appointment

    # --- Appointment requests ----------------------------------------------

    async def list_requests(
        self, clinic_id: int, status_filter: AppointmentRequestStatus | None = None
    ) -> list[AppointmentRequest]:
        query = select(AppointmentRequest).where(AppointmentRequest.clinic_id == clinic_id)
        if status_filter is not None:
            query = query.where(AppointmentRequest.status == status_filter)
        result = await self.db.execute(query.order_by(AppointmentRequest.requested_start))
        return list(result.scalars().all())

    async def create_request(
        self, clinic_id: int, data: AppointmentRequestCreate
    ) -> AppointmentRequest:
        await get_patient_or_404(data.patient_id, clinic_id, self.db)
        req = AppointmentRequest(clinic_id=clinic_id, **data.model_dump())
        self.db.add(req)
        await self.db.commit()
        await self.db.refresh(req)
        return req

    async def _get_request(self, clinic_id: int, request_id: int) -> AppointmentRequest:
        result = await self.db.execute(
            select(AppointmentRequest).where(
                AppointmentRequest.id == request_id, AppointmentRequest.clinic_id == clinic_id
            )
        )
        req = result.scalar_one_or_none()
        if req is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment request not found")
        return req

    async def confirm_request(
        self, clinic_id: int, request_id: int, provider_id: int | None = None
    ) -> Appointment:
        req = await self._get_request(clinic_id, request_id)
        if req.status != AppointmentRequestStatus.PENDING:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Request already resolved")

        end_time = req.requested_end or req.requested_start
        appointment = Appointment(
            clinic_id=clinic_id,
            patient_id=req.patient_id,
            provider_id=provider_id,
            start_time=req.requested_start,
            end_time=end_time,
            status=AppointmentStatus.CONFIRMED,
        )
        self.db.add(appointment)
        await self.db.flush()

        req.status = AppointmentRequestStatus.CONFIRMED
        req.resulting_appointment_id = appointment.id
        await self.db.commit()
        await self.db.refresh(appointment)
        return appointment

    async def decline_request(self, clinic_id: int, request_id: int, reason: str | None) -> AppointmentRequest:
        req = await self._get_request(clinic_id, request_id)
        if req.status != AppointmentRequestStatus.PENDING:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Request already resolved")
        req.status = AppointmentRequestStatus.DECLINED
        if reason:
            req.note = f"{req.note or ''}\n[Declined: {reason}]".strip()
        await self.db.commit()
        await self.db.refresh(req)
        return req
