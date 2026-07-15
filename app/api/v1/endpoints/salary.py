"""Staff salary/payroll endpoints.

Not part of the original reference app's discovered API surface -- added as
a requested extension. See app/models/salary.py for details.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.salary import SalaryRecord
from app.models.user import User, UserRole
from app.schemas.salary import SalaryRecordCreate, SalaryRecordOut, SalaryRecordUpdate
from app.services.salary_service import SalaryService

router = APIRouter(prefix="/clinic/finance/salary", tags=["salary"])

# Only owners/admins can view or manage payroll -- salary data is sensitive
# and staff should not see each other's records via this endpoint.
_manage_payroll = require_role(UserRole.OWNER, UserRole.ADMIN)


@router.get("/", response_model=list[SalaryRecordOut])
async def list_salary_records(
    user_id: int | None = None,
    current_user: User = Depends(_manage_payroll),
    db: AsyncSession = Depends(get_db),
) -> list[SalaryRecord]:
    return await SalaryService(db).list(current_user.clinic_id, user_id)


@router.post("/", response_model=SalaryRecordOut, status_code=status.HTTP_201_CREATED)
async def create_salary_record(
    data: SalaryRecordCreate,
    current_user: User = Depends(_manage_payroll),
    db: AsyncSession = Depends(get_db),
) -> SalaryRecord:
    return await SalaryService(db).create(current_user.clinic_id, data)


@router.get("/{record_id}", response_model=SalaryRecordOut)
async def get_salary_record(
    record_id: int,
    current_user: User = Depends(_manage_payroll),
    db: AsyncSession = Depends(get_db),
) -> SalaryRecord:
    return await SalaryService(db).get(current_user.clinic_id, record_id)


@router.patch("/{record_id}", response_model=SalaryRecordOut)
async def update_salary_record(
    record_id: int,
    data: SalaryRecordUpdate,
    current_user: User = Depends(_manage_payroll),
    db: AsyncSession = Depends(get_db),
) -> SalaryRecord:
    return await SalaryService(db).update(current_user.clinic_id, record_id, data)


@router.post("/{record_id}/pay", response_model=SalaryRecordOut)
async def mark_salary_record_paid(
    record_id: int,
    current_user: User = Depends(_manage_payroll),
    db: AsyncSession = Depends(get_db),
) -> SalaryRecord:
    return await SalaryService(db).mark_paid(current_user.clinic_id, record_id)


@router.post("/{record_id}/cancel", response_model=SalaryRecordOut)
async def cancel_salary_record(
    record_id: int,
    current_user: User = Depends(_manage_payroll),
    db: AsyncSession = Depends(get_db),
) -> SalaryRecord:
    return await SalaryService(db).cancel(current_user.clinic_id, record_id)
