from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_
from sqlalchemy.exc import IntegrityError
from typing import List

from core.config import settings
from core.security import get_current_user_id
from db.database import get_db
from models.applications import Application
from models.application_status import ApplicationStatus
from schemas.applications import ApplicationsWithReport, ApplicationCreate, ApplicationUpdate
from schemas.application_status import StatusCount

router = APIRouter(prefix=settings.API_PREFIX+"/applications")

@router.get("", response_model=ApplicationsWithReport)
def get_applications(role: str | None = None, company: str | None = None, statuses: List[int] | None = Query(None), 
                     user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):

    db.commit()
    db.connection(execution_options={"isolation_level": "REPEATABLE READ"})

    conditions = [
        Application.status_id == ApplicationStatus.status_id,
        Application.user_id == user_id,
    ]
    if role:
        conditions.append(Application.role.istartswith(role, autoescape=True))
    if company:
        conditions.append(Application.company.istartswith(company, autoescape=True))
    if statuses:
        conditions.append(Application.status_id.in_(statuses))
    
    stmt = (
        select(
            Application.application_id,
            Application.role,
            Application.company,
            Application.status_id,
            ApplicationStatus.name.label("status"),
            Application.portal_url,
            Application.notes,
        )
        .select_from(Application)
        .join(ApplicationStatus, and_(*conditions))
    )


    stmt = stmt.order_by(Application.created_at.desc(), Application.application_id.desc())
    
    applications = db.execute(stmt).all()

    stmt2 = (
        select(
            ApplicationStatus.status_id,
            ApplicationStatus.name,
            func.count(Application.application_id).label("count"),
        )
        .select_from(ApplicationStatus)
        .outerjoin(
            Application,
            and_(*conditions),
        )
        .where(or_(ApplicationStatus.user_id.is_(None), ApplicationStatus.user_id == user_id))
        .group_by(ApplicationStatus.status_id, ApplicationStatus.name)
        .order_by(ApplicationStatus.status_id)
    )

    status_counts = db.execute(stmt2).all()
    
    return {"applications": applications, "report": status_counts}

@router.post("")
def create_application(application_data: ApplicationCreate, 
                       user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    
    stmt = (
        select(1).select_from(ApplicationStatus)
        .where(ApplicationStatus.status_id == application_data.status_id, 
               or_(ApplicationStatus.user_id == user_id, ApplicationStatus.user_id.is_(None)))
    )
    valid_status = db.scalars(stmt).one_or_none()

    if not valid_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Status not found",
        )
    application = Application(
        user_id=user_id,
        role=application_data.role,
        company=application_data.company,
        status_id=application_data.status_id,
        portal_url=application_data.portal_url,
        notes=application_data.notes,
    )

    db.add(application)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Invalid content",
        )

@router.put("/{application_id}")
def update_application(application_id: int, updated_application_details: ApplicationUpdate, 
                       user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    stmt = select(Application).select_from(Application).where(Application.application_id == application_id, Application.user_id == user_id)
    application = db.scalars(stmt).one_or_none()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    stmt2 = (
        select(1).select_from(ApplicationStatus)
        .where(ApplicationStatus.status_id == updated_application_details.status_id, 
                or_(ApplicationStatus.user_id == user_id, ApplicationStatus.user_id.is_(None)))
    )
    valid_status = db.scalars(stmt2).one_or_none()

    if not valid_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Status not found",
        )

    application.role = updated_application_details.role
    application.company = updated_application_details.company
    application.status_id = updated_application_details.status_id
    application.portal_url = updated_application_details.portal_url
    application.notes = updated_application_details.notes


    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Invalid content",
        )


@router.delete("/{application_id}")
def delete_application(application_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    stmt = select(Application).select_from(Application).where(Application.application_id == application_id, Application.user_id == user_id)
    application = db.scalars(stmt).one_or_none()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    db.delete(application)
    db.commit()


@router.get("/report", response_model=List[StatusCount])
def get_aggregate_statistics(role: str | None = None, company: str | None = None, statuses: List[int] | None = Query(None), 
                     user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    conditions = [
        Application.status_id == ApplicationStatus.status_id,
        Application.user_id == user_id,
    ]
    if role:
        conditions.append(Application.role.istartswith(role, autoescape=True))
    if company:
        conditions.append(Application.company.istartswith(company, autoescape=True))
    if statuses:
        conditions.append(Application.status_id.in_(statuses))

    stmt = (
        select(
            ApplicationStatus.status_id,
            ApplicationStatus.name,
            func.count(Application.application_id).label("count"),
        )
        .select_from(ApplicationStatus)
        .outerjoin(
            Application,
            and_(*conditions),
        )
        .where(or_(ApplicationStatus.user_id.is_(None), ApplicationStatus.user_id == user_id))
        .group_by(ApplicationStatus.status_id, ApplicationStatus.name)
        .order_by(ApplicationStatus.status_id)
    )

    status_counts = db.execute(stmt).all()

    return status_counts