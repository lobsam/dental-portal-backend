from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.salary import SalaryRecord, SalaryRecordStatus
from app.models.user import User
from app.schemas.salary import SalaryRecordCreate, SalaryRecordUpdate


class SalaryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, clinic_id: int, user_id: int | None = None) -> list[SalaryRecord]:
        query = select(SalaryRecord).where(SalaryRecord.clinic_id == clinic_id)
        if user_id is not None:
            query = query.where(SalaryRecord.user_id == user_id)
        result = await self.db.execute(query.order_by(SalaryRecord.pay_period_start.desc()))
        return list(result.scalars().all())

    async def get(self, clinic_id: int, record_id: int) -> SalaryRecord:
        result = await self.db.execute(
            select(SalaryRecord).where(
                SalaryRecord.id == record_id, SalaryRecord.clinic_id == clinic_id
            )
        )
        record = result.scalar_one_or_none()
        if record is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Salary record not found")
        return record

    async def create(self, clinic_id: int, data: SalaryRecordCreate) -> SalaryRecord:
        staff_user = await self.db.get(User, data.user_id)
        if staff_user is None or staff_user.clinic_id != clinic_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff user not found")

        record = SalaryRecord(clinic_id=clinic_id, **data.model_dump())
        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)
        return record

    async def update(self, clinic_id: int, record_id: int, data: SalaryRecordUpdate) -> SalaryRecord:
        record = await self.get(clinic_id, record_id)
        if record.status != SalaryRecordStatus.PENDING:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only pending records can be edited")

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(record, field, value)
        await self.db.commit()
        await self.db.refresh(record)
        return record

    async def mark_paid(self, clinic_id: int, record_id: int) -> SalaryRecord:
        record = await self.get(clinic_id, record_id)
        if record.status == SalaryRecordStatus.PAID:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Record already paid")
        record.status = SalaryRecordStatus.PAID
        record.paid_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(record)
        return record

    async def cancel(self, clinic_id: int, record_id: int) -> SalaryRecord:
        record = await self.get(clinic_id, record_id)
        if record.status == SalaryRecordStatus.PAID:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot cancel a paid record")
        record.status = SalaryRecordStatus.CANCELLED
        await self.db.commit()
        await self.db.refresh(record)
        return record
