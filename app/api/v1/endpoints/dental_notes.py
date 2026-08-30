from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.dental_note import DENTITIONS, TOOTH_CONDITIONS, DentalNote
from app.models.user import User
from app.schemas.dental_note import (
    DentalNoteCreate,
    DentalNoteOut,
    DentalNoteUpdate,
    ToothChartEntry,
)
from app.services.dental_note_service import DentalNoteService

router = APIRouter(prefix="/clinic", tags=["dental-notes"])


@router.get("/dental-notes/conditions", response_model=list[str])
async def list_tooth_conditions(
    current_user: User = Depends(get_current_user),
) -> list[str]:
    return TOOTH_CONDITIONS


@router.get("/dental-notes/dentitions", response_model=list[str])
async def list_dentitions(
    current_user: User = Depends(get_current_user),
) -> list[str]:
    return DENTITIONS


@router.get("/patients/dental-notes/", response_model=list[DentalNoteOut])
async def list_dental_notes(
    patient_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[DentalNote]:
    return await DentalNoteService(db).list(current_user.clinic_id, patient_id)


@router.post(
    "/patients/dental-notes/",
    response_model=list[DentalNoteOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_dental_note(
    data: DentalNoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[DentalNote]:
    return await DentalNoteService(db).create(current_user.clinic_id, data)


@router.get("/patients/{patient_id}/dental-chart", response_model=list[ToothChartEntry])
async def get_dental_chart(
    patient_id: int,
    dentition: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ToothChartEntry]:
    return await DentalNoteService(db).chart(current_user.clinic_id, patient_id, dentition)


@router.get("/dental-notes/{note_id}", response_model=DentalNoteOut)
async def get_dental_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DentalNote:
    return await DentalNoteService(db).get(current_user.clinic_id, note_id)


@router.patch("/dental-notes/{note_id}", response_model=DentalNoteOut)
async def update_dental_note(
    note_id: int,
    data: DentalNoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DentalNote:
    return await DentalNoteService(db).update(current_user.clinic_id, note_id, data)


@router.delete("/dental-notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dental_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await DentalNoteService(db).delete(current_user.clinic_id, note_id)
