from pydantic import BaseModel


class ClinicOut(BaseModel):
    id: int
    name: str
    contact_number: str | None
    country: str | None
    address: str | None
    timezone: str
    is_active: bool

    model_config = {"from_attributes": True}


class ClinicUpdate(BaseModel):
    name: str | None = None
    contact_number: str | None = None
    country: str | None = None
    address: str | None = None
    timezone: str | None = None
