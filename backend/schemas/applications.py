from pydantic import BaseModel, Field, field_validator
from typing import List
from schemas.application_status import StatusCount

class ApplicationCreate(BaseModel):
    role: str = Field(min_length=1, max_length=255)
    company: str = Field(min_length=1, max_length=255)
    status_id: int
    portal_url: str | None = Field(max_length=2048, default=None)
    notes: str | None = None

    @field_validator("role", mode="before")
    @classmethod
    def validate_role(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value
    @field_validator("company", mode="before")
    @classmethod
    def validate_company(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

class ApplicationUpdate(ApplicationCreate):
    pass

class ApplicationRead(ApplicationCreate):
    application_id: int
    status: str

class ApplicationsWithReport(BaseModel):
    applications: List[ApplicationRead]
    report: List[StatusCount]
