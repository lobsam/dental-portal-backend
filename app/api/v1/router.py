from fastapi import APIRouter

from app.api.v1.endpoints import (
    appointments,
    auth,
    clinic,
    managers,
    patients,
    prescriptions,
    treatment_plans,
)

router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


router.include_router(auth.router)
router.include_router(clinic.router)
router.include_router(patients.router)
router.include_router(appointments.router)
router.include_router(managers.router)
router.include_router(treatment_plans.router)
router.include_router(prescriptions.router)
