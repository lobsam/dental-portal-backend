from sqlalchemy import ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Role(Base, TimestampMixin):
    """A clinic-defined custom role: a name plus a per-menu-item permission
    map. Distinct from the built-in UserRole enum (owner/admin/dentist/
    staff), which still governs coarse system access (e.g. who can manage
    payroll or staff). A custom Role is optional, finer-grained UI-level
    permissioning that a clinic can assign to a staff member on top of
    their base UserRole."""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id", ondelete="CASCADE"), index=True)

    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)

    # {menu_key: "none" | "view" | "write"}. Menu keys correspond to
    # MENU_ITEMS in app/schemas/role.py. Kept as a flexible JSON map rather
    # than a normalized permissions table so new menu items can be added
    # without a migration.
    permissions: Mapped[dict] = mapped_column(JSON, default=dict)
