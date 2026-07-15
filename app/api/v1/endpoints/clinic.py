from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.clinic import Clinic
from app.models.user import User, UserRole
from app.schemas.auth import ChangePasswordRequest
from app.schemas.clinic import ClinicOut, ClinicUpdate
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter(prefix="/clinic", tags=["clinic"])


@router.post("/auth/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await AuthService(db).change_password(current_user, data.current_password, data.new_password)


@router.get("/profile/", response_model=ClinicOut)
async def get_profile(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> Clinic:
    return await db.get(Clinic, current_user.clinic_id)


@router.patch("/profile/", response_model=ClinicOut)
async def update_profile(
    data: ClinicUpdate,
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> Clinic:
    clinic = await db.get(Clinic, current_user.clinic_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(clinic, field, value)
    await db.commit()
    await db.refresh(clinic)
    return clinic


@router.get("/settings/users/", response_model=list[UserOut])
async def list_users(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[User]:
    return await UserService(db).list(current_user.clinic_id)


@router.post(
    "/settings/users/",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_user(
    data: UserCreate,
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> User:
    return await UserService(db).create(current_user.clinic_id, data)


@router.get("/settings/users/{user_id}", response_model=UserOut)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    return await UserService(db).get(current_user.clinic_id, user_id)


@router.patch("/settings/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    data: UserUpdate,
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> User:
    return await UserService(db).update(current_user.clinic_id, user_id, data)
