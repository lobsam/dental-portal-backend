from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserOut(BaseModel):
    id: int
    clinic_id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None
    role: UserRole
    specialization: str | None
    is_active: bool
    custom_role_id: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    phone: str | None = None
    role: UserRole = UserRole.STAFF
    specialization: str | None = None
    custom_role_id: int | None = None


class MeOut(UserOut):
    # Resolved menu permissions for the current user (see
    # app/services/role_service.py:resolve_permissions), keyed by the same
    # menu keys as MENU_GROUPS. Owners/admins and staff with no custom role
    # assigned get "write" for every key (unrestricted); staff with a
    # custom role get exactly that role's map, defaulting missing keys to
    # "none". The frontend uses this to hide nav items the user can't see.
    permissions: dict[str, str] = {}


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    role: UserRole | None = None
    specialization: str | None = None
    is_active: bool | None = None
    custom_role_id: int | None = None
