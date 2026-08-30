from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin

# Free-text condition tag. Kept as a plain string (not a DB enum) so new
# conditions can be added on the frontend without a migration -- matches the
# lesson learned from the enum values_callable issues on other models.
TOOTH_CONDITIONS = [
    "healthy",
    "cavity",
    "filling",
    "crown",
    "root_canal",
    "missing",
    "extraction_needed",
    "bridge",
    "implant",
    "impacted",
    "other",
]


DENTITIONS = ["adult", "pediatric"]


class DentalNote(Base, TimestampMixin):
    __tablename__ = "dental_notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id", ondelete="CASCADE"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    provider_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    # "adult" (32 permanent teeth) or "pediatric" (20 primary teeth). Scopes
    # the meaning of tooth_number: for adult it's Universal numbering
    # (1-32); for pediatric it's a canonical index 1-20 corresponding to
    # primary teeth A-T. The FDI equivalent for either is derived on the
    # frontend for display/toggle purposes.
    dentition: Mapped[str] = mapped_column(String(20), default="adult", server_default="adult")
    tooth_number: Mapped[int | None] = mapped_column(Integer, index=True)
    condition: Mapped[str | None] = mapped_column(String(50))

    # Comma-separated Procedure ids performed/planned for this note (e.g.
    # "1,3,5"). Kept as a simple string column rather than an association
    # table to avoid a migration-heavy many-to-many for what is just a
    # multi-select tag on the note; parsed to/from list[int] in the schema.
    procedure_ids: Mapped[str | None] = mapped_column(String(255))

    title: Mapped[str | None] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    note_date: Mapped[date] = mapped_column(Date)
