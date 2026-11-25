from sqlalchemy import String, Text, func, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from datetime import datetime

from db.database import Base

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from models.users import User


class Application(Base):
    __tablename__ = "Applications"

    application_id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("Users.user_id", ondelete="CASCADE"))

    role: Mapped[str] = mapped_column(String(255))
    company: Mapped[str] = mapped_column(String(255))
    status_id: Mapped[int] = mapped_column(ForeignKey("ApplicationStatuses.status_id"), index=True)

    portal_url: Mapped[str | None] = mapped_column(String(2048))
    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(server_default = func.now())
    #updated_at: Mapped[datetime | None] = mapped_column()

    user: Mapped["User"] = relationship(back_populates="applications", lazy = "raise")

    __table_args__ = (
        Index("application_user_status", "user_id", "status_id"),
        Index("application_user_timestamp", "user_id", "created_at")
    )