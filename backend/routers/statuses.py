from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_, and_
from sqlalchemy.exc import IntegrityError
from typing import List

from core.config import settings
from core.security import get_current_user_id
from db.database import get_db
from models.application_status import ApplicationStatus
from models.applications import Application
from schemas.application_status import StatusRead, StatusCreate, StatusDetails

router = APIRouter(prefix=settings.API_PREFIX+"/statuses")


def visible_to(user_id: int):
    # Default statuses (user_id IS NULL) plus this user's own custom statuses
    return or_(ApplicationStatus.user_id.is_(None), ApplicationStatus.user_id == user_id)


@router.get("", response_model=List[StatusDetails])
def get_statuses(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    stmt = (
        select(
            ApplicationStatus.status_id,
            ApplicationStatus.name,
            ApplicationStatus.user_id.is_(None).label("is_default"),
            func.count(Application.application_id).label("count")
        )
        .select_from(ApplicationStatus)
        .outerjoin(
            Application,
            and_(Application.status_id == ApplicationStatus.status_id, Application.user_id == user_id)
        )
        .where(visible_to(user_id))
        .group_by(ApplicationStatus.status_id, ApplicationStatus.name, ApplicationStatus.user_id)
        .order_by(ApplicationStatus.status_id)
    )
    statuses = db.execute(stmt).all()
    return statuses


@router.post("", status_code=status.HTTP_201_CREATED, response_model=StatusRead)
def create_status(status_data: StatusCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # The unique constraint on (user_id, name) can't catch a clash with a default,
    # because defaults have user_id NULL and NULLs never count as equal.
    # So check against every status this user can see, ignoring case.
    stmt = (
        select(1)
        .select_from(ApplicationStatus)
        .where(
            visible_to(user_id),
            func.lower(ApplicationStatus.name) == status_data.name.lower(),
        )
    )
    if db.scalars(stmt).one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Status already exists",
        )

    new_status = ApplicationStatus(user_id=user_id, name=status_data.name)
    db.add(new_status)

    try:
        db.commit()
    except IntegrityError:
        # Two identical requests at the same moment can both pass the check above;
        # the unique constraint stops the second one here
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Status already exists",
        )

    # Returned so the frontend can select the new status in the dropdown right away
    return new_status


@router.delete("/{status_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_status(status_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Matching on user_id means defaults (user_id NULL) and other users' statuses both give 404
    stmt = (
        select(ApplicationStatus)
        .select_from(ApplicationStatus)
        .where(ApplicationStatus.status_id == status_id, ApplicationStatus.user_id == user_id)
    )
    existing_status = db.scalars(stmt).one_or_none()

    if existing_status is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Status not found",
        )

    db.delete(existing_status)

    try:
        db.commit()
    except IntegrityError:
        # Applications or StatusHistory rows still reference this status
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Status is in use",
        )
