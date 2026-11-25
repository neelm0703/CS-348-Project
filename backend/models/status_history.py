from sqlalchemy import func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from datetime import datetime

from db.database import Base

class StatusHistory(Base):
    __tablename__ = "StatusHistory"

    id: Mapped[int] = mapped_column(primary_key = True)
    application_id: Mapped[int] = mapped_column(ForeignKey("Applications.application_id", ondelete="CASCADE"))
    old_status_id: Mapped[int] = mapped_column(ForeignKey("ApplicationStatuses.status_id"))
    new_status_id: Mapped[int] = mapped_column(ForeignKey("ApplicationStatuses.status_id"))
    timestamp: Mapped[datetime] = mapped_column(server_default = func.now())