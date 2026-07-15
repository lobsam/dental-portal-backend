from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.drug import Drug
from app.models.procedure import Procedure
from app.models.user import User
from app.schemas.drug import DrugCreate, DrugOut, DrugUpdate
from app.schemas.procedure import ProcedureCreate, ProcedureOut, ProcedureUpdate
from app.services.drug_service import DrugService
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
