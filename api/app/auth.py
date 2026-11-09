"""Password hashing (stdlib PBKDF2) and cookie session helpers."""

import hashlib
import hmac
import secrets
from datetime import timedelta

from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import get_db
from .models import Company, SessionToken, User, utcnow

COOKIE_NAME = "portal_session"
SESSION_DAYS = 14
_PBKDF2_ROUNDS = 210_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _PBKDF2_ROUNDS)
    return f"pbkdf2_sha256${_PBKDF2_ROUNDS}${salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _algo, rounds, salt, expected = stored.split("$")
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(rounds))
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(digest.hex(), expected)


def create_session(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(32)
    db.add(SessionToken(token=token, user_id=user.id, expires_at=utcnow() + timedelta(days=SESSION_DAYS)))
    db.commit()
    return token


def attach_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=SESSION_DAYS * 24 * 3600,
        httponly=True,
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not signed in")

    row = db.execute(select(SessionToken).where(SessionToken.token == token)).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    expires_at = row.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=utcnow().tzinfo)
    if expires_at < utcnow():
        db.delete(row)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    user = db.get(User, row.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not signed in")
    return user


def get_current_company(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Company:
    """Tenant scope: every data query is filtered by this company id."""
    company = db.get(Company, user.company_id)
    if company is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Company not found")
    return company
