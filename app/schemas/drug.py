from pydantic import BaseModel


class DrugBase(BaseModel):
    generic_name: str
    brand_name: str | None = None
    dosage_form: str | None = None


class DrugCreate(DrugBase):
    pass


class DrugUpdate(BaseModel):
    generic_name: str | None = None
    brand_name: str | None = None
    dosage_form: str | None = None
    is_active: bool | None = None


class DrugOut(DrugBase):
    id: int
    clinic_id: int
    is_active: bool

    model_config = {"from_attributes": True}
