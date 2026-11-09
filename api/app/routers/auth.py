from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import (
    attach_session_cookie,
    clear_session_cookie,
    create_session,
    get_current_user,
    get_current_company,
    hash_password,
    verify_password,
)
from ..db import get_db
from ..models import Company, User
from ..schemas import CompanyOut, LoginIn, SessionOut, SignupIn, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupIn, response: Response, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    exists = db.execute(select(User.id).where(func.lower(User.email) == email)).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with that email already exists")

    company = Company(name=payload.company_name.strip(), industry="", greeting_script="")
    db.add(company)
    db.flush()

    user = User(
        email=email,
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
        role="owner",
        company_id=company.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.refresh(company)

    attach_session_cookie(response, create_session(db, user))
    return SessionOut(user=UserOut.model_validate(user), company=CompanyOut.model_validate(company))


@router.post("/login", response_model=SessionOut)
def login(payload: LoginIn, response: Response, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.execute(select(User).where(func.lower(User.email) == email)).scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    company = db.get(Company, user.company_id)
    attach_session_cookie(response, create_session(db, user))
    return SessionOut(user=UserOut.model_validate(user), company=CompanyOut.model_validate(company))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    clear_session_cookie(response)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=SessionOut)
def me(user: User = Depends(get_current_user), company: Company = Depends(get_current_company)):
    return SessionOut(user=UserOut.model_validate(user), company=CompanyOut.model_validate(company))
