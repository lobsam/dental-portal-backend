from pydantic import BaseModel


class ProcedureBase(BaseModel):
    code: str | None = None
    name: str
    category: str | None = None
    default_cost: float | None = None


class ProcedureCreate(ProcedureBase):
    pass


class ProcedureUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    category: str | None = None
    default_cost: float | None = None
    is_active: bool | None = None


class ProcedureOut(ProcedureBase):
    id: int
    clinic_id: int
    is_active: bool

    model_config = {"from_attributes": True}
