from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_patient_or_404
from app.models.finance import (
    AccountingEntry,
    AccountingEntryType,
    Expense,
    SoaInvoice,
    SoaInvoiceStatus,
)
from app.schemas.finance import (
    AccountingEntryCreate,
    ExpenseCreate,
    ExpenseUpdate,
    FinanceOverview,
    SoaInvoiceCreate,
    SoaInvoiceUpdate,
)


class ExpenseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, clinic_id: int) -> list[Expense]:
        result = await self.db.execute(
            select(Expense).where(Expense.clinic_id == clinic_id).order_by(Expense.expense_date.desc())
        )
        return list(result.scalars().all())

    async def get(self, clinic_id: int, expense_id: int) -> Expense:
        result = await self.db.execute(
            select(Expense).where(Expense.id == expense_id, Expense.clinic_id == clinic_id)
        )
        expense = result.scalar_one_or_none()
        if expense is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Expense not found")
        return expense

    async def create(self, clinic_id: int, created_by_id: int, data: ExpenseCreate) -> Expense:
        expense = Expense(clinic_id=clinic_id, created_by_id=created_by_id, **data.model_dump())
        self.db.add(expense)
        await self.db.commit()
        await self.db.refresh(expense)
        return expense

    async def update(self, clinic_id: int, expense_id: int, data: ExpenseUpdate) -> Expense:
        expense = await self.get(clinic_id, expense_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(expense, field, value)
        await self.db.commit()
        await self.db.refresh(expense)
        return expense

    async def delete(self, clinic_id: int, expense_id: int) -> None:
        expense = await self.get(clinic_id, expense_id)
        await self.db.delete(expense)
        await self.db.commit()


class AccountingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, clinic_id: int) -> list[AccountingEntry]:
        result = await self.db.execute(
            select(AccountingEntry)
            .where(AccountingEntry.clinic_id == clinic_id)
            .order_by(AccountingEntry.entry_date.desc())
        )
        return list(result.scalars().all())

    async def create(self, clinic_id: int, data: AccountingEntryCreate) -> AccountingEntry:
        entry = AccountingEntry(clinic_id=clinic_id, **data.model_dump())
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)
        return entry


class SoaInvoiceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, clinic_id: int, patient_id: int | None = None) -> list[SoaInvoice]:
        query = select(SoaInvoice).where(SoaInvoice.clinic_id == clinic_id)
        if patient_id is not None:
            query = query.where(SoaInvoice.patient_id == patient_id)
        result = await self.db.execute(query.order_by(SoaInvoice.issued_at.desc()))
        return list(result.scalars().all())

    async def get(self, clinic_id: int, invoice_id: int) -> SoaInvoice:
        result = await self.db.execute(
            select(SoaInvoice).where(SoaInvoice.id == invoice_id, SoaInvoice.clinic_id == clinic_id)
        )
        invoice = result.scalar_one_or_none()
        if invoice is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")
        return invoice

    async def create(self, clinic_id: int, data: SoaInvoiceCreate) -> SoaInvoice:
        await get_patient_or_404(data.patient_id, clinic_id, self.db)
        invoice = SoaInvoice(clinic_id=clinic_id, **data.model_dump())
        self.db.add(invoice)
        await self.db.commit()
        await self.db.refresh(invoice)
        return invoice

    async def update(self, clinic_id: int, invoice_id: int, data: SoaInvoiceUpdate) -> SoaInvoice:
        invoice = await self.get(clinic_id, invoice_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(invoice, field, value)
        await self.db.commit()
        await self.db.refresh(invoice)
        return invoice

    async def record_payment(self, clinic_id: int, invoice_id: int, amount: float) -> SoaInvoice:
        invoice = await self.get(clinic_id, invoice_id)
        if invoice.status == SoaInvoiceStatus.VOID:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot pay a voided invoice")
        if amount <= 0:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Payment amount must be positive")

        invoice.amount_paid = float(invoice.amount_paid) + amount
        if invoice.amount_paid >= float(invoice.amount):
            invoice.status = SoaInvoiceStatus.PAID
        else:
            invoice.status = SoaInvoiceStatus.PARTIALLY_PAID

        await self.db.commit()
        await self.db.refresh(invoice)
        return invoice


class FinanceOverviewService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_overview(self, clinic_id: int) -> FinanceOverview:
        income_result = await self.db.execute(
            select(func.coalesce(func.sum(AccountingEntry.amount), 0)).where(
                AccountingEntry.clinic_id == clinic_id,
                AccountingEntry.entry_type == AccountingEntryType.INCOME,
            )
        )
        expense_entries_result = await self.db.execute(
            select(func.coalesce(func.sum(AccountingEntry.amount), 0)).where(
                AccountingEntry.clinic_id == clinic_id,
                AccountingEntry.entry_type == AccountingEntryType.EXPENSE,
            )
        )
        expenses_result = await self.db.execute(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(Expense.clinic_id == clinic_id)
        )
        outstanding_result = await self.db.execute(
            select(
                func.coalesce(func.sum(SoaInvoice.amount - SoaInvoice.amount_paid), 0),
                func.count(SoaInvoice.id),
            ).where(
                SoaInvoice.clinic_id == clinic_id,
                SoaInvoice.status.in_([SoaInvoiceStatus.UNPAID, SoaInvoiceStatus.PARTIALLY_PAID]),
            )
        )

        total_income = float(income_result.scalar_one())
        total_expenses = float(expense_entries_result.scalar_one()) + float(expenses_result.scalar_one())
        outstanding_total, outstanding_count = outstanding_result.one()

        return FinanceOverview(
            total_income=total_income,
            total_expenses=total_expenses,
            net=total_income - total_expenses,
            outstanding_invoices_total=float(outstanding_total),
            outstanding_invoices_count=int(outstanding_count),
        )
