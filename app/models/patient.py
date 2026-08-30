from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Patient(Base, TimestampMixin):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True)
    clinic_id: Mapped[int] = mapped_column(ForeignKey("clinics.id", ondelete="CASCADE"), index=True)

    # Identity -- mirrors new.dentalclinicapp.com's /patients/add form
    # (patient.modules.personal.form.fields in its i18n bundle).
    patient_code: Mapped[str | None] = mapped_column(String(50))  # "id_no" -- optional external/chart ID
    first_name: Mapped[str] = mapped_column(String(100))
    middle_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    suffix: Mapped[str | None] = mapped_column(String(20))
    nickname: Mapped[str | None] = mapped_column(String(100))

    gender: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(32))
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    address: Mapped[str | None] = mapped_column(String(500))
    job_title: Mapped[str | None] = mapped_column(String(150))  # "job_name" / Profession

    # Vitals shown on the intake form
    height: Mapped[float | None] = mapped_column(Numeric(6, 2))
    weight: Mapped[float | None] = mapped_column(Numeric(6, 2))

    # Emergency / recall
    emergency_contact_name: Mapped[str | None] = mapped_column(String(200))
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(32))
    recall_date: Mapped[date | None] = mapped_column(Date)

    # Allergies -- the source app has a selectable allergy catalog
    # (allergy_id) plus a free-text override (allergies); we keep the
    # free-text field and a boolean flag, and can promote allergy_id to a
    # managers/allergies lookup table later if that catalog is needed.
    has_allergies: Mapped[bool] = mapped_column(Boolean, default=False)
    allergies: Mapped[str | None] = mapped_column(Text)

    # Referral / marketing source -- maps to clinic/managers/patient-sources/
    patient_source_id: Mapped[int | None] = mapped_column(
        ForeignKey("patient_sources.id", ondelete="SET NULL")
    )

    photo_url: Mapped[str | None] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(default=True)

    # "adult" or "pediatric" -- fixes which dental chart layout (32
    # permanent teeth vs 20 primary teeth) applies to this patient. Left
    # unset until the dentist is asked on first visiting the dental chart,
    # so a patient is never shown both layouts.
    dentition: Mapped[str | None] = mapped_column(String(20))

    clinic: Mapped["Clinic"] = relationship(back_populates="patients")  # noqa: F821
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="patient")  # noqa: F821
    patient_source: Mapped["PatientSource | None"] = relationship()  # noqa: F821
