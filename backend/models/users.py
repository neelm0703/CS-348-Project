from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from datetime import datetime

from db.database import Base

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from models.applications import Application

class User(Base):
    __tablename__ = "Users"

    user_id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(server_default = func.now())

    applications: Mapped[list["Application"]] = relationship(back_populates="user", lazy = "raise")