from datetime import date, datetime

from pydantic import BaseModel

from app.models.finance import AccountingEntryType, SoaInvoiceStatus

# --- Expenses -----------------------------------------------------------------


class ExpenseCreate(BaseModel):
    category: str | None = None
    description: str | None = None
    amount: float
    expense_date: date


class ExpenseUpdate(BaseModel):
    category: str | None = None
    description: str | None = None
    amount: float | None = None
    expense_date: date | None = None


class ExpenseOut(BaseModel):
    id: int
    clinic_id: int
    created_by_id: int | None
    category: str | None
    description: str | None
    amount: float
    expense_date: date
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Accounting entries ---------------------------------------------------------


class AccountingEntryCreate(BaseModel):
    entry_type: AccountingEntryType
    amount: float
    description: str | None = None
    entry_date: date
    reference: str | None = None


class AccountingEntryOut(AccountingEntryCreate):
    id: int
    clinic_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- SOA invoices ------------------------------------------------------------


class SoaInvoiceCreate(BaseModel):
    patient_id: int
    invoice_number: str
    amount: float
    due_date: date | None = None
    notes: str | None = None


class SoaInvoiceUpdate(BaseModel):
    amount: float | None = None
    due_date: date | None = None
    status: SoaInvoiceStatus | None = None
    notes: str | None = None


class SoaInvoicePayment(BaseModel):
    amount: float


class SoaInvoiceOut(BaseModel):
    id: int
    clinic_id: int
    patient_id: int
    invoice_number: str
    amount: float
    amount_paid: float
    status: SoaInvoiceStatus
    due_date: date | None
    issued_at: datetime
    notes: str | None

    model_config = {"from_attributes": True}


# --- Finance overview ------------------------------------------------------------


class FinanceOverview(BaseModel):
    total_income: float
    total_expenses: float
    net: float
    outstanding_invoices_total: float
    outstanding_invoices_count: int
