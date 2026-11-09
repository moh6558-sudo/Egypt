from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_company
from ..db import get_db
from ..models import Company
from ..schemas import CompanyOut, CompanyUpdate

router = APIRouter(prefix="/api/company", tags=["company"])


@router.get("", response_model=CompanyOut)
def read_company(company: Company = Depends(get_current_company)):
    return company


@router.put("", response_model=CompanyOut)
def update_company(
    payload: CompanyUpdate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if value is not None:
            setattr(company, field, value)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company
