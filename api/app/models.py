from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def default_business_hours() -> list:
    return [
        {"day": "Monday", "open": "09:00", "close": "17:00", "closed": False},
        {"day": "Tuesday", "open": "09:00", "close": "17:00", "closed": False},
        {"day": "Wednesday", "open": "09:00", "close": "17:00", "closed": False},
        {"day": "Thursday", "open": "09:00", "close": "17:00", "closed": False},
        {"day": "Friday", "open": "09:00", "close": "17:00", "closed": False},
        {"day": "Saturday", "open": "10:00", "close": "14:00", "closed": False},
        {"day": "Sunday", "open": "10:00", "close": "14:00", "closed": True},
    ]


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    industry: Mapped[str] = mapped_column(String(120), default="")
    phone_number: Mapped[str] = mapped_column(String(40), default="")
    greeting_script: Mapped[str] = mapped_column(Text, default="")
    business_hours: Mapped[list] = mapped_column(JSON, default=default_business_hours)
    faqs: Mapped[list] = mapped_column(JSON, default=list)
    calendar_link: Mapped[str] = mapped_column(String(400), default="")
    subscription_status: Mapped[str] = mapped_column(String(30), default="trialing")
    plan: Mapped[str] = mapped_column(String(30), default="starter")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    users: Mapped[list["User"]] = relationship(back_populates="company")
    call_logs: Mapped[list["CallLog"]] = relationship(back_populates="company")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="company")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    password_hash: Mapped[str] = mapped_column(String(300))
    role: Mapped[str] = mapped_column(String(30), default="owner")
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    company: Mapped[Company] = relationship(back_populates="users")


class SessionToken(Base):
    __tablename__ = "sessions"

    token: Mapped[str] = mapped_column(String(80), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class CallLog(Base):
    __tablename__ = "call_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True)
    caller_name: Mapped[str] = mapped_column(String(120), default="")
    caller_phone: Mapped[str] = mapped_column(String(40), default="")
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    summary: Mapped[str] = mapped_column(Text, default="")
    transcript: Mapped[str] = mapped_column(Text, default="")
    recording_url: Mapped[str] = mapped_column(String(500), default="")
    outcome: Mapped[str] = mapped_column(String(30), default="Inquiry")
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    company: Mapped[Company] = relationship(back_populates="call_logs")


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True)
    customer_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(40), default="")
    service: Mapped[str] = mapped_column(String(160), default="")
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    status: Mapped[str] = mapped_column(String(30), default="Scheduled")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    company: Mapped[Company] = relationship(back_populates="appointments")
