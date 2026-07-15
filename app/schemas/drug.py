from pydantic import BaseModel


class DrugBase(BaseModel):
    name: str
    dosage_form: str | None = None
    strength: str | None = None


class DrugCreate(DrugBase):
    pass


class DrugUpdate(BaseModel):
    name: str | None = None
    dosage_form: str | None = None
    strength: str | None = None
    is_active: bool | None = None


class DrugOut(DrugBase):
    id: int
    clinic_id: int
    is_active: bool

    model_config = {"from_attributes": True}
