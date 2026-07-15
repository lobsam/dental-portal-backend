from datetime import date, datetime

from pydantic import BaseModel

from app.models.salary import SalaryRecordStatus


class SalaryRecordCreate(BaseModel):
    user_id: int
    pay_period_start: date
    pay_period_end: date
    base_salary: float
    bonuses: float = 0
    deductions: float = 0


class SalaryRecordUpdate(BaseModel):
    base_salary: float | None = None
    bonuses: float | None = None
    deductions: float | None = None


class SalaryRecordOut(BaseModel):
    id: int
    clinic_id: int
    user_id: int
    pay_period_start: date
    pay_period_end: date
    base_salary: float
    bonuses: float
    deductions: float
    net_pay: float
    status: SalaryRecordStatus
    paid_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
