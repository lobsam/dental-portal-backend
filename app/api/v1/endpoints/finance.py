from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.finance import AccountingEntry, Expense, SoaInvoice
from app.models.user import User, UserRole
from app.schemas.finance import (
    AccountingEntryCreate,
    AccountingEntryOut,
    ExpenseCreate,
    ExpenseOut,
    ExpenseUpdate,
    FinanceOverview,
    SoaInvoiceCreate,
    SoaInvoiceOut,
    SoaInvoicePayment,
    SoaInvoiceUpdate,
)
from app.services.finance_service import (
    AccountingService,
    ExpenseService,
    FinanceOverviewService,
    SoaInvoiceService,
)

router = APIRouter(prefix="/clinic/finance", tags=["finance"])


@router.get("/", response_model=FinanceOverview)
async def get_finance_overview(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> FinanceOverview:
    return await FinanceOverviewService(db).get_overview(current_user.clinic_id)


# --- Expenses -----------------------------------------------------------------


@router.get("/expenses/", response_model=list[ExpenseOut])
async def list_expenses(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[Expense]:
    return await ExpenseService(db).list(current_user.clinic_id)


@router.post("/expenses/", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create_expense(
    data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Expense:
    return await ExpenseService(db).create(current_user.clinic_id, current_user.id, data)


@router.get("/expenses/{expense_id}", response_model=ExpenseOut)
async def get_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Expense:
    return await ExpenseService(db).get(current_user.clinic_id, expense_id)


@router.patch("/expenses/{expense_id}", response_model=ExpenseOut)
async def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Expense:
    return await ExpenseService(db).update(current_user.clinic_id, expense_id, data)


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: int,
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> None:
    await ExpenseService(db).delete(current_user.clinic_id, expense_id)


# --- Accounting -----------------------------------------------------------------


@router.get("/accounting/", response_model=list[AccountingEntryOut])
async def list_accounting_entries(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[AccountingEntry]:
    return await AccountingService(db).list(current_user.clinic_id)


@router.post(
    "/accounting/", response_model=AccountingEntryOut, status_code=status.HTTP_201_CREATED
)
async def create_accounting_entry(
    data: AccountingEntryCreate,
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AccountingEntry:
    return await AccountingService(db).create(current_user.clinic_id, data)


# --- SOA invoices ------------------------------------------------------------


@router.get("/soa-invoices/", response_model=list[SoaInvoiceOut])
async def list_soa_invoices(
    patient_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SoaInvoice]:
    return await SoaInvoiceService(db).list(current_user.clinic_id, patient_id)


@router.post(
    "/soa-invoices/", response_model=SoaInvoiceOut, status_code=status.HTTP_201_CREATED
)
async def create_soa_invoice(
    data: SoaInvoiceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SoaInvoice:
    return await SoaInvoiceService(db).create(current_user.clinic_id, data)


@router.get("/soa-invoices/{invoice_id}", response_model=SoaInvoiceOut)
async def get_soa_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SoaInvoice:
    return await SoaInvoiceService(db).get(current_user.clinic_id, invoice_id)


@router.patch("/soa-invoices/{invoice_id}", response_model=SoaInvoiceOut)
async def update_soa_invoice(
    invoice_id: int,
    data: SoaInvoiceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SoaInvoice:
    return await SoaInvoiceService(db).update(current_user.clinic_id, invoice_id, data)


@router.post("/soa-invoices/{invoice_id}/payments", response_model=SoaInvoiceOut)
async def pay_soa_invoice(
    invoice_id: int,
    data: SoaInvoicePayment,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SoaInvoice:
    return await SoaInvoiceService(db).record_payment(current_user.clinic_id, invoice_id, data.amount)
