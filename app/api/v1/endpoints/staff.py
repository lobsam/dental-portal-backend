from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/clinic/staff", tags=["staff"])

# Only owners/admins can view or manage the staff roster.
_manage_staff = require_role(UserRole.OWNER, UserRole.ADMIN)


@router.get("/", response_model=list[UserOut])
async def list_staff(
    current_user: User = Depends(_manage_staff),
    db: AsyncSession = Depends(get_db),
) -> list[User]:
    return await UserService(db).list(current_user.clinic_id)


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_staff(
    data: UserCreate,
    current_user: User = Depends(_manage_staff),
    db: AsyncSession = Depends(get_db),
) -> User:
    return await UserService(db).create(current_user.clinic_id, data)


@router.get("/{user_id}", response_model=UserOut)
async def get_staff(
    user_id: int,
    current_user: User = Depends(_manage_staff),
    db: AsyncSession = Depends(get_db),
) -> User:
    return await UserService(db).get(current_user.clinic_id, user_id)


@router.patch("/{user_id}", response_model=UserOut)
async def update_staff(
    user_id: int,
    data: UserUpdate,
    current_user: User = Depends(_manage_staff),
    db: AsyncSession = Depends(get_db),
) -> User:
    return await UserService(db).update(current_user.clinic_id, user_id, data)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_staff(
    user_id: int,
    current_user: User = Depends(_manage_staff),
    db: AsyncSession = Depends(get_db),
) -> None:
    await UserService(db).update(current_user.clinic_id, user_id, UserUpdate(is_active=False))
