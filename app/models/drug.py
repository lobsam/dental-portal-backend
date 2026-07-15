from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Drug(Base, TimestampMixin):
    """Clinic-level prescription drug catalog."""

    __tablename__ = "drugs"

    id: Mapped[int] = mapped_column(primary_key=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id", ondelete="CASCADE"), index=True)

    name: Mapped[str] = mapped_column(String(255))
    dosage_form: Mapped[str | None] = mapped_column(String(100))
    strength: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(default=True)
