from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.role import Role
from app.models.user import User, UserRole
from app.schemas.role import MENU_GROUPS, RoleCreate, RoleOut, RoleUpdate
from app.services.role_service import RoleService

router = APIRouter(prefix="/clinic/roles", tags=["roles"])

# Defining roles/permissions is itself a sensitive, clinic-wide setting --
# restrict it the same way staff management is restricted.
_manage_roles = require_role(UserRole.OWNER, UserRole.ADMIN)


@router.get("/menu-items")
async def list_menu_items(current_user: User = Depends(_manage_roles)) -> list[dict]:
    """Grouped list of (key, label) menu items a role's permissions can
    cover, for the Role Manager UI to render as a permission matrix."""
    return [
        {"group": group, "items": [{"key": key, "label": label} for key, label in items]}
        for group, items in MENU_GROUPS
    ]


@router.get("/", response_model=list[RoleOut])
async def list_roles(
    current_user: User = Depends(_manage_roles),
    db: AsyncSession = Depends(get_db),
) -> list[Role]:
    return await RoleService(db).list(current_user.clinic_id)


@router.post("/", response_model=RoleOut, status_code=status.HTTP_201_CREATED)
async def create_role(
    data: RoleCreate,
    current_user: User = Depends(_manage_roles),
    db: AsyncSession = Depends(get_db),
) -> Role:
    return await RoleService(db).create(current_user.clinic_id, data)


@router.get("/{role_id}", response_model=RoleOut)
async def get_role(
    role_id: int,
    current_user: User = Depends(_manage_roles),
    db: AsyncSession = Depends(get_db),
) -> Role:
    return await RoleService(db).get(current_user.clinic_id, role_id)


@router.patch("/{role_id}", response_model=RoleOut)
async def update_role(
    role_id: int,
    data: RoleUpdate,
    current_user: User = Depends(_manage_roles),
    db: AsyncSession = Depends(get_db),
) -> Role:
    return await RoleService(db).update(current_user.clinic_id, role_id, data)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    current_user: User = Depends(_manage_roles),
    db: AsyncSession = Depends(get_db),
) -> None:
    await RoleService(db).delete(current_user.clinic_id, role_id)
