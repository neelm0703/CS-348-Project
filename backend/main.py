from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from routers.applications import router as applications_router
from routers.auth import router as auth_router
from routers.statuses import router as statuses_router
from models.application_status import ApplicationStatus
from models.applications import Application
from models.users import User
from db.database import Base, engine, get_db
from core.config import settings


app = FastAPI()

Base.metadata.create_all(engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(applications_router)
app.include_router(auth_router)
app.include_router(statuses_router)


@app.get("/")
def root():
    return {"message": "Working"}


# Public, no auth. Touches a real table so the scheduled keep-alive job counts as
# database activity on Supabase, and returns 503 if the database is unreachable.
@app.get(settings.API_PREFIX + "/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(select(1).select_from(User).limit(1))
    except SQLAlchemyError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")
    return {"status": "ok"}
