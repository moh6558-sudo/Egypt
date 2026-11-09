from collections import Counter
from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_company
from ..db import get_db
from ..models import Appointment, CallLog, Company, utcnow
from ..schemas import AppointmentOut, CallLogOut

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def dashboard(company: Company = Depends(get_current_company), db: Session = Depends(get_db)):
    now = utcnow()
    window_start = now - timedelta(days=30)
    previous_start = now - timedelta(days=60)

    logs = (
        db.execute(
            select(CallLog)
            .where(CallLog.company_id == company.id, CallLog.occurred_at >= previous_start)
            .order_by(CallLog.occurred_at.desc())
        )
        .scalars()
        .all()
    )
    appointments = (
        db.execute(
            select(Appointment)
            .where(Appointment.company_id == company.id)
            .order_by(Appointment.scheduled_at.asc())
        )
        .scalars()
        .all()
    )

    current = [log for log in logs if log.occurred_at >= window_start]
    previous = [log for log in logs if window_start > log.occurred_at >= previous_start]

    booked = sum(1 for log in current if log.outcome == "Booked")
    missed = sum(1 for log in current if log.outcome == "Missed")
    talk_seconds = sum(log.duration_seconds for log in current)

    upcoming = [a for a in appointments if a.scheduled_at >= now and a.status == "Scheduled"][:5]

    today = now.date()
    volume = []
    for offset in range(13, -1, -1):
        day = today - timedelta(days=offset)
        count = sum(1 for log in logs if log.occurred_at.date() == day)
        volume.append({"date": day.isoformat(), "label": day.strftime("%a"), "count": count})

    outcome_counts = Counter(log.outcome for log in current)
    outcomes = [
        {"outcome": name, "count": outcome_counts.get(name, 0)}
        for name in ("Booked", "Inquiry", "Missed")
    ]

    return {
        "stats": {
            "calls_30d": len(current),
            "calls_prev_30d": len(previous),
            "booked_30d": booked,
            "missed_30d": missed,
            "booking_rate": round(booked / len(current) * 100) if current else 0,
            "talk_minutes_30d": round(talk_seconds / 60),
            "upcoming_appointments": len([a for a in appointments if a.scheduled_at >= now and a.status == "Scheduled"]),
        },
        "volume": volume,
        "outcomes": outcomes,
        "recent_calls": [CallLogOut.model_validate(log) for log in logs[:5]],
        "upcoming": [AppointmentOut.model_validate(a) for a in upcoming],
        "agent": {
            "phone_number": company.phone_number,
            "status": company.subscription_status,
            "plan": company.plan,
        },
    }
