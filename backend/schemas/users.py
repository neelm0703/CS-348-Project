from pydantic import BaseModel, EmailStr, Field, field_validator


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return value.lower().strip() if isinstance(value, str) else value

class UserCreate(UserLogin):
    name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

class UserRead(BaseModel):
    user_id: int
    name: str
    email: str

