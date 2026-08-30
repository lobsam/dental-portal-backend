from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.models.user import User, UserRole
from app.schemas.role import MENU_KEYS, RoleCreate, RoleUpdate


def _clean_permissions(permissions: dict[str, str]) -> dict[str, str]:
    """Drop unknown menu keys and no-op ("none") entries so stored
    permission maps stay small and valid against the current menu list."""
    return {k: v for k, v in permissions.items() if k in MENU_KEYS and v != "none"}


# These pages hard-require an owner/admin UserRole at the API layer (see
# require_role(OWNER, ADMIN) on /clinic/staff and /clinic/roles) -- no
# custom Role permission can unlock them, so they're never shown as
# available to a non-admin, regardless of their custom role's map.
_ADMIN_ONLY_KEYS = {"role_manager", "users_list"}


async def resolve_permissions(user: User, db: AsyncSession) -> dict[str, str]:
    """Resolved per-menu-item permission level for a user, for the frontend
    to decide what to show in navigation. Owners/admins always get full
    access (they're the ones who manage roles in the first place). A
    non-admin user with no custom role assigned also gets full access
    (minus the admin-only pages above), so assigning a Role Manager role is
    what opts a staff member into restriction -- existing staff aren't
    silently locked out of menus they could already see."""
    if user.role in (UserRole.OWNER, UserRole.ADMIN):
        return {key: "write" for key in MENU_KEYS}

    if user.custom_role_id is None:
        return {
            key: ("none" if key in _ADMIN_ONLY_KEYS else "write") for key in MENU_KEYS
        }

    role = await db.get(Role, user.custom_role_id)
    if role is None:
        return {
            key: ("none" if key in _ADMIN_ONLY_KEYS else "write") for key in MENU_KEYS
        }

    return {
        key: ("none" if key in _ADMIN_ONLY_KEYS else role.permissions.get(key, "none"))
        for key in MENU_KEYS
    }


class RoleService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, clinic_id: int) -> list[Role]:
        result = await self.db.execute(
            select(Role).where(Role.clinic_id == clinic_id).order_by(Role.name)
        )
        return list(result.scalars().all())

    async def get(self, clinic_id: int, role_id: int) -> Role:
        result = await self.db.execute(
            select(Role).where(Role.id == role_id, Role.clinic_id == clinic_id)
        )
        role = result.scalar_one_or_none()
        if role is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
        return role

    async def create(self, clinic_id: int, data: RoleCreate) -> Role:
        role = Role(
            clinic_id=clinic_id,
            name=data.name,
            description=data.description,
            permissions=_clean_permissions(data.permissions),
        )
        self.db.add(role)
        await self.db.commit()
        await self.db.refresh(role)
        return role

    async def update(self, clinic_id: int, role_id: int, data: RoleUpdate) -> Role:
        role = await self.get(clinic_id, role_id)
        payload = data.model_dump(exclude_unset=True)
        if "permissions" in payload and payload["permissions"] is not None:
            payload["permissions"] = _clean_permissions(payload["permissions"])
        for field, value in payload.items():
            setattr(role, field, value)
        await self.db.commit()
        await self.db.refresh(role)
        return role

    async def delete(self, clinic_id: int, role_id: int) -> None:
        role = await self.get(clinic_id, role_id)
        await self.db.delete(role)
        await self.db.commit()
