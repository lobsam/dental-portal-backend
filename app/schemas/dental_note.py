from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, field_validator

Dentition = Literal["adult", "pediatric"]


def _parse_procedure_ids(v):
    if v is None:
        return []
    if isinstance(v, str):
        return [int(x) for x in v.split(",") if x.strip()]
    return v


class DentalNoteCreate(BaseModel):
    patient_id: int
    provider_id: int | None = None
    dentition: Dentition = "adult"
    # A dentist may mark several teeth with the same note in one go (e.g.
    # "cavity" on teeth 3, 14, 19). tooth_numbers takes precedence when
    # provided; tooth_number remains for single-tooth / backward-compat use.
    # One DentalNote row is created per tooth.
    tooth_number: int | None = None
    tooth_numbers: list[int] | None = None
    condition: str | None = None
    procedure_ids: list[int] | None = None
    title: str | None = None
    content: str
    note_date: date


class DentalNoteUpdate(BaseModel):
    provider_id: int | None = None
    dentition: Dentition | None = None
    tooth_number: int | None = None
    condition: str | None = None
    procedure_ids: list[int] | None = None
    title: str | None = None
    content: str | None = None
    note_date: date | None = None


class DentalNoteOut(BaseModel):
    id: int
    clinic_id: int
    patient_id: int
    provider_id: int | None
    dentition: str
    tooth_number: int | None
    condition: str | None
    procedure_ids: list[int] = []
    title: str | None
    content: str
    note_date: date
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    _parse_procedure_ids = field_validator("procedure_ids", mode="before")(_parse_procedure_ids)


class ToothChartEntry(BaseModel):
    """Latest known condition for a single tooth, derived from dental notes."""

    dentition: str
    tooth_number: int
    condition: str | None
    note_id: int | None
    note_date: date | None
