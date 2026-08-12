from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.drug import Drug
from app.models.expense_category import ExpenseCategory
from app.models.patient_source import PatientSource
from app.models.procedure import Procedure
from app.models.user import User
from app.schemas.drug import DrugCreate, DrugOut, DrugUpdate
from app.schemas.expense_category import (
    ExpenseCategoryCreate,
    ExpenseCategoryOut,
    ExpenseCategoryUpdate,
)
from app.schemas.patient_source import PatientSourceCreate, PatientSourceOut, PatientSourceUpdate
from app.schemas.procedure import ProcedureCreate, ProcedureOut, ProcedureUpdate
from app.services.drug_service import DrugService
from app.services.expense_category_service import ExpenseCategoryService
from app.services.patient_source_service import PatientSourceService
from app.services.procedure_service import ProcedureService

router = APIRouter(prefix="/clinic/managers", tags=["managers"])


# --- Procedures --------------------------------------------------------------


@router.get("/procedures/", response_model=list[ProcedureOut])
async def list_procedures(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[Procedure]:
    return await ProcedureService(db).list(current_user.clinic_id)


@router.post("/procedures/", response_model=ProcedureOut, status_code=status.HTTP_201_CREATED)
async def create_procedure(
    data: ProcedureCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Procedure:
    return await ProcedureService(db).create(current_user.clinic_id, data)


@router.get("/procedures/{procedure_id}", response_model=ProcedureOut)
async def get_procedure(
    procedure_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Procedure:
    return await ProcedureService(db).get(current_user.clinic_id, procedure_id)


@router.patch("/procedures/{procedure_id}", response_model=ProcedureOut)
async def update_procedure(
    procedure_id: int,
    data: ProcedureUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Procedure:
    return await ProcedureService(db).update(current_user.clinic_id, procedure_id, data)


@router.delete("/procedures/{procedure_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_procedure(
    procedure_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await ProcedureService(db).delete(current_user.clinic_id, procedure_id)


# --- Drug list -----------------------------------------------------------------


@router.get("/drug-list/", response_model=list[DrugOut])
async def list_drugs(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[Drug]:
    return await DrugService(db).list(current_user.clinic_id)


@router.post("/drug-list/", response_model=DrugOut, status_code=status.HTTP_201_CREATED)
async def create_drug(
    data: DrugCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Drug:
    return await DrugService(db).create(current_user.clinic_id, data)


@router.get("/drug-list/{drug_id}", response_model=DrugOut)
async def get_drug(
    drug_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Drug:
    return await DrugService(db).get(current_user.clinic_id, drug_id)


@router.patch("/drug-list/{drug_id}", response_model=DrugOut)
async def update_drug(
    drug_id: int,
    data: DrugUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Drug:
    return await DrugService(db).update(current_user.clinic_id, drug_id, data)


@router.delete("/drug-list/{drug_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_drug(
    drug_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await DrugService(db).delete(current_user.clinic_id, drug_id)


# --- Patient sources -------------------------------------------------------------


@router.get("/patient-sources/", response_model=list[PatientSourceOut])
async def list_patient_sources(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[PatientSource]:
    return await PatientSourceService(db).list(current_user.clinic_id)


@router.post(
    "/patient-sources/", response_model=PatientSourceOut, status_code=status.HTTP_201_CREATED
)
async def create_patient_source(
    data: PatientSourceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PatientSource:
    return await PatientSourceService(db).create(current_user.clinic_id, data)


@router.get("/patient-sources/{source_id}", response_model=PatientSourceOut)
async def get_patient_source(
    source_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PatientSource:
    return await PatientSourceService(db).get(current_user.clinic_id, source_id)


@router.patch("/patient-sources/{source_id}", response_model=PatientSourceOut)
async def update_patient_source(
    source_id: int,
    data: PatientSourceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PatientSource:
    return await PatientSourceService(db).update(current_user.clinic_id, source_id, data)


@router.delete("/patient-sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient_source(
    source_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await PatientSourceService(db).delete(current_user.clinic_id, source_id)


# --- Expense categories ----------------------------------------------------------


@router.get("/expense-categories/", response_model=list[ExpenseCategoryOut])
async def list_expense_categories(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[ExpenseCategory]:
    return await ExpenseCategoryService(db).list(current_user.clinic_id)


@router.post(
    "/expense-categories/",
    response_model=ExpenseCategoryOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_expense_category(
    data: ExpenseCategoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseCategory:
    return await ExpenseCategoryService(db).create(current_user.clinic_id, data)


@router.get("/expense-categories/{category_id}", response_model=ExpenseCategoryOut)
async def get_expense_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseCategory:
    return await ExpenseCategoryService(db).get(current_user.clinic_id, category_id)


@router.patch("/expense-categories/{category_id}", response_model=ExpenseCategoryOut)
async def update_expense_category(
    category_id: int,
    data: ExpenseCategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExpenseCategory:
    return await ExpenseCategoryService(db).update(current_user.clinic_id, category_id, data)


@router.delete("/expense-categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await ExpenseCategoryService(db).delete(current_user.clinic_id, category_id)
