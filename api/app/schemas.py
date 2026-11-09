from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- auth ---------------------------------------------------------------

class SignupIn(BaseModel):
    company_name: str = Field(min_length=1, max_length=160)
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    role: str
    company_id: int


# --- company ------------------------------------------------------------

class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    industry: str
    phone_number: str
    greeting_script: str
    business_hours: list
    faqs: list
    calendar_link: str
    subscription_status: str
    plan: str
    created_at: datetime


class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=160)
    industry: Optional[str] = Field(default=None, max_length=120)
    phone_number: Optional[str] = Field(default=None, max_length=40)
    greeting_script: Optional[str] = Field(default=None, max_length=4000)
    business_hours: Optional[list] = None
    faqs: Optional[list] = None
    calendar_link: Optional[str] = Field(default=None, max_length=400)


class SessionOut(BaseModel):
    user: UserOut
    company: CompanyOut


# --- call logs ----------------------------------------------------------

class CallLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    caller_name: str
    caller_phone: str
    duration_seconds: int
    summary: str
    transcript: str
    recording_url: str
    outcome: str
    occurred_at: datetime


# --- appointments -------------------------------------------------------

AppointmentStatus = Literal["Scheduled", "Completed", "Cancelled"]


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_name: str
    phone: str
    service: str
    scheduled_at: datetime
    status: str
    created_at: datetime


class AppointmentCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=120)
    phone: str = Field(default="", max_length=40)
    service: str = Field(default="", max_length=160)
    scheduled_at: datetime
    status: AppointmentStatus = "Scheduled"


class AppointmentUpdate(BaseModel):
    customer_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=40)
    service: Optional[str] = Field(default=None, max_length=160)
    scheduled_at: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None
