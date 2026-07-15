from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.prescription import Prescription
from app.models.user import User
from app.schemas.prescription import PrescriptionCreate, PrescriptionOut
from app.services.prescription_service import PrescriptionService

router = APIRouter(prefix="/clinic", tags=["prescriptions"])


@router.get("/patients/prescriptions/", response_model=list[PrescriptionOut])
async def list_prescriptions(
    patient_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Prescription]:
    return await PrescriptionService(db).list(current_user.clinic_id, patient_id)


@router.post(
    "/patients/prescriptions/",
    response_model=PrescriptionOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_prescription(
    data: PrescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Prescription:
    return await PrescriptionService(db).create(current_user.clinic_id, data)


@router.get("/prescriptions/{prescription_id}", response_model=PrescriptionOut)
async def get_prescription(
    prescription_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Prescription:
    return await PrescriptionService(db).get(current_user.clinic_id, prescription_id)
