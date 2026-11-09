from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..auth import get_current_company
from ..db import get_db
from ..models import CallLog, Company
from ..schemas import CallLogOut

router = APIRouter(prefix="/api/call-logs", tags=["call logs"])


def _company_log(db: Session, company: Company, log_id: int) -> CallLog:
    log = db.get(CallLog, log_id)
    # Tenancy check: a log from another company is indistinguishable from a missing one.
    if log is None or log.company_id != company.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call not found")
    return log


@router.get("", response_model=list[CallLogOut])
def list_call_logs(
    outcome: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=500),
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    stmt = select(CallLog).where(CallLog.company_id == company.id)
    if outcome and outcome.lower() != "all":
        stmt = stmt.where(CallLog.outcome == outcome)
    if q:
        needle = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            or_(
                CallLog.caller_name.ilike(needle),
                CallLog.caller_phone.ilike(needle),
                CallLog.summary.ilike(needle),
                CallLog.transcript.ilike(needle),
            )
        )
    stmt = stmt.order_by(CallLog.occurred_at.desc()).limit(limit)
    return db.execute(stmt).scalars().all()


@router.get("/{log_id}", response_model=CallLogOut)
def get_call_log(
    log_id: int,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    return _company_log(db, company, log_id)
