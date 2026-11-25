from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from core.security import get_password_hash, verify_password, set_jwt_token, delete_jwt_token, get_current_user, DUMMY_HASH
from core.config import settings
from db.database import get_db
from models.users import User
from schemas.users import UserLogin, UserCreate, UserRead

router = APIRouter(prefix=settings.API_PREFIX+"/auth")

@router.post("/login", status_code=status.HTTP_204_NO_CONTENT)
def login(credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    stmt = select(User).select_from(User).where(User.email == credentials.email)
    user = db.scalars(stmt).one_or_none()

    if user is None:
        verify_password(credentials.password, DUMMY_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    set_jwt_token(response, user.user_id)





@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    delete_jwt_token(response)





@router.post("/signup", status_code=status.HTTP_204_NO_CONTENT)
def signup(new_user_details: UserCreate, response: Response, db: Session = Depends(get_db)):
    user = User(
        name=new_user_details.name,
        email=new_user_details.email,
        hashed_password=get_password_hash(new_user_details.password)
    )
    db.add(user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    set_jwt_token(response, user.user_id)

@router.get("/me", status_code=status.HTTP_200_OK, response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return user