from collections import defaultdict
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_company
from ..db import get_db
from ..models import CallLog, Company, utcnow

router = APIRouter(prefix="/api/billing", tags=["billing"])

PLANS = [
    {
        "id": "starter",
        "name": "Starter",
        "price": 99,
        "included_minutes": 300,
        "phone_numbers": 1,
        "features": ["1 AI receptionist", "1 phone number", "Call transcripts", "Email support"],
    },
    {
        "id": "growth",
        "name": "Growth",
        "price": 199,
        "included_minutes": 1000,
        "phone_numbers": 3,
        "features": ["Everything in Starter", "3 phone numbers", "Calendar booking", "SMS follow-ups"],
    },
    {
        "id": "agency",
        "name": "Agency",
        "price": 399,
        "included_minutes": 2500,
        "phone_numbers": 10,
        "features": ["Everything in Growth", "10 phone numbers", "White-label portal", "Priority support"],
    },
]

PLAN_BY_ID = {plan["id"]: plan for plan in PLANS}


class PlanChangeIn(BaseModel):
    plan_id: str


def _month_start(year: int, month: int):
    from datetime import datetime, timezone

    return datetime(year, month, 1, tzinfo=timezone.utc)


@router.get("")
def billing(company: Company = Depends(get_current_company), db: Session = Depends(get_db)):
    now = utcnow()
    plan = PLAN_BY_ID.get(company.plan, PLANS[0])
    current_month_start = _month_start(now.year, now.month)

    logs = (
        db.execute(
            select(CallLog).where(CallLog.company_id == company.id).order_by(CallLog.occurred_at.desc())
        )
        .scalars()
        .all()
    )

    month_logs = [log for log in logs if log.occurred_at >= current_month_start]
    minutes_used = round(sum(log.duration_seconds for log in month_logs) / 60)
    percent = min(round(minutes_used / plan["included_minutes"] * 100), 100) if plan["included_minutes"] else 0

    # Statements are derived from real call activity, one per month.
    buckets: dict[str, dict] = defaultdict(lambda: {"calls": 0, "seconds": 0})
    for log in logs:
        key = log.occurred_at.strftime("%Y-%m")
        buckets[key]["calls"] += 1
        buckets[key]["seconds"] += log.duration_seconds

    statements = []
    for key in sorted(buckets.keys(), reverse=True)[:4]:
        data = buckets[key]
        is_current = key == now.strftime("%Y-%m")
        statements.append(
            {
                "period": key,
                "calls": data["calls"],
                "minutes": round(data["seconds"] / 60),
                "amount": plan["price"],
                "status": "Open" if is_current else "Paid",
            }
        )

    return {
        "plan_id": plan["id"],
        "plan_name": plan["name"],
        "price": plan["price"],
        "subscription_status": company.subscription_status,
        "renews_on": (current_month_start + timedelta(days=32)).replace(day=1).isoformat(),
        "usage": {
            "calls": len(month_logs),
            "minutes_used": minutes_used,
            "included_minutes": plan["included_minutes"],
            "percent": percent,
            "phone_numbers": plan["phone_numbers"],
        },
        "plans": PLANS,
        "statements": statements,
    }


@router.post("/plan")
def change_plan(
    payload: PlanChangeIn,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    plan = PLAN_BY_ID.get(payload.plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown plan")
    company.plan = plan["id"]
    if company.subscription_status in ("trialing", "canceled"):
        company.subscription_status = "active"
    db.add(company)
    db.commit()
    return {"plan_id": company.plan, "subscription_status": company.subscription_status}
