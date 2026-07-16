import enum

from sqlalchemy import Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class TreatmentPlanStatus(str, enum.Enum):
    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TreatmentPlanItemStatus(str, enum.Enum):
    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    COMPLETED = "completed"
    DECLINED = "declined"


class TreatmentPlan(Base, TimestampMixin):
    __tablename__ = "treatment_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id", ondelete="CASCADE"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    provider_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    status: Mapped[TreatmentPlanStatus] = mapped_column(
        Enum(
            TreatmentPlanStatus,
            name="treatment_plan_status",
            values_callable=lambda obj: [e.value for e in obj],
        ),
        default=TreatmentPlanStatus.PROPOSED,
    )
    notes: Mapped[str | None] = mapped_column(Text)

    items: Mapped[list["TreatmentPlanItem"]] = relationship(
        back_populates="treatment_plan", cascade="all, delete-orphan"
    )


class TreatmentPlanItem(Base, TimestampMixin):
    __tablename__ = "treatment_plan_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    treatment_plan_id: Mapped[int] = mapped_column(
        ForeignKey("treatment_plans.id", ondelete="CASCADE"), index=True
    )
    procedure_id: Mapped[int | None] = mapped_column(ForeignKey("procedures.id", ondelete="SET NULL"))

    tooth_number: Mapped[str | None] = mapped_column(String(10))
    description: Mapped[str | None] = mapped_column(String(500))
    cost: Mapped[float | None] = mapped_column(Numeric(10, 2))
    status: Mapped[TreatmentPlanItemStatus] = mapped_column(
        Enum(
            TreatmentPlanItemStatus,
            name="treatment_plan_item_status",
            values_callable=lambda obj: [e.value for e in obj],
        ),
        default=TreatmentPlanItemStatus.PROPOSED,
    )

    treatment_plan: Mapped["TreatmentPlan"] = relationship(back_populates="items")
