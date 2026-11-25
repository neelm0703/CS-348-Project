from sqlalchemy import String, ForeignKey, UniqueConstraint, event, DDL
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base

class ApplicationStatus(Base):
    __tablename__ = "ApplicationStatuses"

    status_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("Users.user_id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(50))

    __table_args__ = (
        UniqueConstraint('user_id', 'name', name='uq_user_status_name'),
    )

event.listen(
    ApplicationStatus.__table__,
    "after_create",
    DDL("""
        INSERT INTO "ApplicationStatuses" (name) VALUES
        ('Applied'), ('OA'), ('Interviewing'), ('Offer'), ('Accepted'), ('Rejected'), ('Withdrawn')
    """),
)

