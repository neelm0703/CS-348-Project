from pydantic import BaseModel, Field, field_validator


class StatusRead(BaseModel):
    status_id: int
    name: str

class StatusDetails(StatusRead):
    is_default: bool
    count: int

class StatusCount(StatusRead):
    count: int

class StatusCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value
