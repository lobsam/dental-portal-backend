from pydantic import BaseModel


class PatientSourceCreate(BaseModel):
    name: str


class PatientSourceUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class PatientSourceOut(BaseModel):
    id: int
    clinic_id: int
    name: str
    is_active: bool

    model_config = {"from_attributes": True}
