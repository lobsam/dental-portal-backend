from pydantic import BaseModel


class ExpenseCategoryCreate(BaseModel):
    name: str


class ExpenseCategoryUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class ExpenseCategoryOut(BaseModel):
    id: int
    clinic_id: int
    name: str
    is_active: bool

    model_config = {"from_attributes": True}
