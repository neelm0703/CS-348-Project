import jwt
from pwdlib import PasswordHash
from datetime import datetime, timedelta, timezone

from fastapi import Cookie, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from core.config import settings
from models.users import User
from db.database import get_db

password_hash = PasswordHash.recommended()

DUMMY_HASH = password_hash.hash("dummypassword")


def get_password_hash(password):
    return password_hash.hash(password)

def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)

def create_jwt(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_jwt(jwt_token):
    if not jwt_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not Authenticated",
        ) 
    
    try:
        payload = jwt.decode(jwt_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], options={"require": ["exp", "sub"]})
        user_id = int(payload.get("sub"))
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not Authenticated")

    return user_id

def set_jwt_token(response, user_id):
    jwt_token = create_jwt(user_id)
    response.set_cookie(
        key="jwt_token",
        value=jwt_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

def delete_jwt_token(response):
    response.delete_cookie(
        key="jwt_token",
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
    )

def get_current_user_id(jwt_token: str | None = Cookie(None), db: Session = Depends(get_db)):
    user_id = decode_jwt(jwt_token)

    stmt = select(1).select_from(User).where(User.user_id == user_id)
    valid_user_id = db.scalars(stmt).one_or_none()

    if not valid_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not Authenticated")
    return user_id

def get_current_user(jwt_token: str | None = Cookie(None), db: Session = Depends(get_db)):
    user_id = decode_jwt(jwt_token)

    stmt = select(User).select_from(User).where(User.user_id == user_id)
    user = db.scalars(stmt).one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not Authenticated")
    return user
