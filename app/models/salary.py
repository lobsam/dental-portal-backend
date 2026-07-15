"""Staff salary/payroll module.

Note: this domain was NOT found in the reference app
(new.dentalclinicapp.com) during the endpoint audit — its `clinic/finance/`
routes only covered accounting, expenses, reports, and soa-invoices. This is
an added extension for staff payroll, requested separately, and is not a
reproduction of the original site's API.
"""

import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class SalaryRecordStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"


class SalaryRecord(Base, TimestampMixin):
    __tablename__ = "salary_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    pay_period_start: Mapped[date] = mapped_column(Date)
    pay_period_end: Mapped[date] = mapped_column(Date)
    base_salary: Mapped[float] = mapped_column(Numeric(10, 2))
    bonuses: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    deductions: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    status: Mapped[SalaryRecordStatus] = mapped_column(
        Enum(SalaryRecordStatus, name="salary_record_status"), default=SalaryRecordStatus.PENDING
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    @property
    def net_pay(self) -> float:
        return float(self.base_salary) + float(self.bonuses) - float(self.deductions)
