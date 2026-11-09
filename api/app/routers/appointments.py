from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_company
from ..db import get_db
from ..models import Appointment, Company, utcnow
from ..schemas import AppointmentCreate, AppointmentOut, AppointmentUpdate

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


def _company_appointment(db: Session, company: Company, appointment_id: int) -> Appointment:
    appointment = db.get(Appointment, appointment_id)
    if appointment is None or appointment.company_id != company.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return appointment


@router.get("", response_model=list[AppointmentOut])
def list_appointments(
    scope: str = Query(default="all", pattern="^(all|upcoming|past)$"),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    stmt = select(Appointment).where(Appointment.company_id == company.id)
    if scope == "upcoming":
        stmt = stmt.where(Appointment.scheduled_at >= utcnow())
    elif scope == "past":
        stmt = stmt.where(Appointment.scheduled_at < utcnow())
    if status_filter and status_filter.lower() != "all":
        stmt = stmt.where(Appointment.status == status_filter)
    order = Appointment.scheduled_at.asc() if scope != "past" else Appointment.scheduled_at.desc()
    return db.execute(stmt.order_by(order)).scalars().all()


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    appointment = Appointment(company_id=company.id, **payload.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.patch("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    appointment = _company_appointment(db, company, appointment_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(appointment, field, value)
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: int,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    appointment = _company_appointment(db, company, appointment_id)
    db.delete(appointment)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
