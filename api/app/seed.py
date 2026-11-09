"""Seed two demo workspaces so a fresh database has something to show (and prove tenancy)."""

import logging
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import hash_password
from .models import Appointment, CallLog, Company, User, default_business_hours, utcnow

log = logging.getLogger("portal.seed")

DEMO_PASSWORD = "demo1234"

NORTHLINE_CALLS = [
    (0, 9, 12, "Alicia Moreno", "+1 (415) 555-0188", 184, "Booked",
     "Booked a new-patient cleaning for Thursday at 9:30am; insurance provider confirmed.",
     "Agent: Thanks for calling Northline Dental Studio, this is Ava. How can I help?\n"
     "Caller: Hi, I need a cleaning as a new patient.\n"
     "Agent: Happy to help. Do you have dental insurance through an employer?\n"
     "Caller: Yes, Aetna through my job.\n"
     "Agent: We're in network. I have Thursday 9:30am or Friday 2:00pm.\n"
     "Caller: Thursday works.\n"
     "Agent: Booked. You'll get a text confirmation in a minute."),
    (0, 8, 40, "Unknown caller", "+1 (415) 555-0102", 46, "Missed",
     "Caller hung up during the greeting; no message left.",
     "Agent: Thanks for calling Northline Dental Studio, this is Ava. How can I help?\n"
     "[call ended by caller]"),
    (1, 15, 22, "Derek Whitfield", "+1 (628) 555-0143", 312, "Inquiry",
     "Asked about Invisalign pricing and payment plans; took a message for the treatment coordinator.",
     "Agent: Thanks for calling Northline Dental Studio. How can I help?\n"
     "Caller: What does Invisalign cost?\n"
     "Agent: Most cases run between $3,500 and $5,500 and we offer 12-month plans. The coordinator can give you an exact quote after a scan.\n"
     "Caller: Can someone call me back tomorrow?\n"
     "Agent: Of course — I've noted your number for a callback tomorrow morning."),
    (1, 11, 5, "Priya Raman", "+1 (415) 555-0164", 231, "Booked",
     "Rescheduled a hygiene visit from Friday to next Tuesday at 2:15pm.",
     "Agent: Northline Dental Studio, this is Ava.\n"
     "Caller: I need to move my Friday cleaning.\n"
     "Agent: No problem. I have Tuesday 2:15pm or Thursday 10:00am.\n"
     "Caller: Tuesday at 2:15 please.\n"
     "Agent: Moved and confirmed — see you Tuesday."),
    (2, 16, 48, "Marcus Lee", "+1 (510) 555-0177", 97, "Missed",
     "Called after hours, declined voicemail and hung up.",
     "Agent: You've reached Northline Dental Studio. We're closed right now — our hours are 8:30 to 5:30 Monday to Friday.\n"
     "Caller: [no response]\n"
     "[call ended by caller]"),
    (2, 10, 31, "Sofia Alvarez", "+1 (415) 555-0121", 268, "Booked",
     "Booked a root canal consultation for Monday 11:00am; flagged mild pain.",
     "Agent: Northline Dental Studio, this is Ava.\n"
     "Caller: My back tooth hurts when I bite down.\n"
     "Agent: I'm sorry to hear that. Dr. Patel has a consultation Monday at 11:00am — does that work?\n"
     "Caller: Yes, please. It's been sore for four days.\n"
     "Agent: Booked. I'll flag it as urgent pain so the team can prioritise you."),
    (3, 14, 12, "Grant Osei", "+1 (650) 555-0139", 143, "Inquiry",
     "Asked whether the practice accepts Delta Dental PPO; confirmed and took a message.",
     "Agent: Northline Dental Studio, this is Ava.\n"
     "Caller: Do you take Delta Dental PPO?\n"
     "Agent: Yes, we're in network with Delta Dental PPO.\n"
     "Caller: Great, I'll call back to book.\n"
     "Agent: I can book you now if you'd like — otherwise I've noted your number."),
    (4, 9, 58, "Hannah Kim", "+1 (415) 555-0155", 205, "Booked",
     "New patient whitening consult booked for Saturday at 10:30am.",
     "Agent: Northline Dental Studio, this is Ava.\n"
     "Caller: I'd like a whitening consultation.\n"
     "Agent: We have Saturday 10:30am with our hygienist.\n"
     "Caller: Perfect.\n"
     "Agent: You're booked — please arrive ten minutes early for paperwork."),
    (5, 13, 37, "Luis Ortega", "+1 (415) 555-0193", 88, "Inquiry",
     "Asked for the office address and parking instructions.",
     "Agent: Northline Dental Studio, this is Ava.\n"
     "Caller: Where are you located?\n"
     "Agent: 2140 Fillmore Street, second floor. There's validated parking in the garage on Pine.\n"
     "Caller: Thanks, that's all.\n"
     "Agent: Happy to help — have a good afternoon."),
    (6, 17, 41, "Rebecca Toms", "+1 (628) 555-0180", 63, "Missed",
     "Dropped call during the after-hours greeting; no message.",
     "Agent: You've reached Northline Dental Studio. We're closed right now.\n"
     "[call ended by caller]"),
    (7, 8, 52, "Ibrahim Youssef", "+1 (415) 555-0170", 356, "Booked",
     "Booked an emergency same-day slot for a chipped molar at 1:00pm.",
     "Agent: Northline Dental Studio, this is Ava.\n"
     "Caller: I chipped a molar this morning, it's sharp.\n"
     "Agent: Let me squeeze you in. Dr. Patel has 1:00pm today.\n"
     "Caller: I'll take it.\n"
     "Agent: Booked. Please avoid chewing on that side until you're seen."),
    (8, 12, 19, "Chloe Bertrand", "+1 (510) 555-0112", 174, "Inquiry",
     "Asked about night guard cost and insurance coverage; message taken for the coordinator.",
     "Agent: Northline Dental Studio, this is Ava.\n"
     "Caller: How much is a night guard?\n"
     "Agent: Custom guards start at $350 and are often partially covered. Our coordinator can confirm your benefits.\n"
     "Caller: Please have her call me.\n"
     "Agent: Noted — you'll hear back within one business day."),
    (9, 15, 3, "Tomás Silva", "+1 (415) 555-0188", 221, "Booked",
     "Booked a 6-month cleaning for the 24th at 3:45pm.",
     "Agent: Northline Dental Studio, this is Ava.\n"
     "Caller: Time for my six-month cleaning.\n"
     "Agent: I have the 24th at 3:45pm with Kayla.\n"
     "Caller: Book it.\n"
     "Agent: Confirmed — reminder text goes out 48 hours before."),
    (10, 10, 47, "Nadia Farouk", "+1 (650) 555-0166", 129, "Inquiry",
     "Asked about pediatric appointments for a 6-year-old; message taken for scheduling.",
     "Agent: Northline Dental Studio, this is Ava.\n"
     "Caller: Do you see children? My son is six.\n"
     "Agent: We do, from age four. Our pediatric hygienist is in Tuesday and Thursday afternoons.\n"
     "Caller: I'll check my work schedule and call back.\n"
     "Agent: I've noted it so you won't have to repeat yourself."),
    (11, 16, 21, "Oliver Grant", "+1 (415) 555-0134", 74, "Missed",
     "Called during the lunch closure and hung up before the voicemail prompt.",
     "Agent: Northline Dental Studio is closed for lunch until 1:00pm.\n"
     "[call ended by caller]"),
    (12, 9, 34, "Mei Tanaka", "+1 (415) 555-0129", 298, "Booked",
     "Booked a first visit with Dr. Patel for next Wednesday at 4:00pm; insurance verified.",
     "Agent: Northline Dental Studio, this is Ava.\n"
     "Caller: I was referred by a friend, I'd like a check-up.\n"
     "Agent: Welcome. Are you using insurance or paying directly?\n"
     "Caller: MetLife.\n"
     "Agent: We're in network. Wednesday 4:00pm with Dr. Patel is open.\n"
     "Caller: Book it, please.\n"
     "Agent: Done — new patient forms will be texted to you."),
    (13, 11, 58, "Samuel Adeyemi", "+1 (628) 555-0107", 187, "Inquiry",
     "Asked about whitening options and aftercare.",
     "Agent: Northline Dental Studio, this is Ava.\n"
     "Caller: What whitening do you offer?\n"
     "Agent: In-chair whitening in a single 60-minute visit, or take-home trays over two weeks.\n"
     "Caller: How long do results last?\n"
     "Agent: Typically 12 to 18 months with good aftercare. I can book a consult if you'd like.\n"
     "Caller: I'll think about it."),
    (14, 14, 44, "Grace Whitmore", "+1 (415) 555-0161", 246, "Booked",
     "Moved an appointment and booked a follow-up cleaning.",
     "Agent: Northline Dental Studio, this is Ava.\n"
     "Caller: I need to shift my Thursday visit.\n"
     "Agent: I can move you to Friday 11:15am and add the follow-up cleaning in six months.\n"
     "Caller: Do both.\n"
     "Agent: Done — both appointments are confirmed."),
]

# Positive day offsets are in the future, negative in the past.
NORTHLINE_APPOINTMENTS = [
    (1, 9, 30, "Alicia Moreno", "+1 (415) 555-0188", "New patient cleaning", "Scheduled"),
    (2, 11, 0, "Sofia Alvarez", "+1 (415) 555-0121", "Root canal consultation", "Scheduled"),
    (3, 14, 15, "Priya Raman", "+1 (415) 555-0164", "Hygiene visit (rescheduled)", "Scheduled"),
    (4, 10, 30, "Hannah Kim", "+1 (415) 555-0155", "Whitening consultation", "Scheduled"),
    (5, 15, 45, "Tomás Silva", "+1 (415) 555-0188", "Six-month cleaning", "Scheduled"),
    (6, 16, 0, "Mei Tanaka", "+1 (415) 555-0129", "First visit — Dr. Patel", "Scheduled"),
    (-2, 13, 0, "Ibrahim Youssef", "+1 (415) 555-0170", "Emergency exam", "Completed"),
    (-5, 9, 0, "Chloe Bertrand", "+1 (510) 555-0112", "Night guard fitting", "Completed"),
    (-7, 10, 0, "Oliver Grant", "+1 (415) 555-0134", "Cleaning", "Cancelled"),
]

HARBOR_CALLS = [
    (0, 18, 20, "Elena Rossi", "+1 (212) 555-0141", 152, "Booked",
     "Booked a table for four on Friday at 8:00pm, one guest gluten-free.",
     "Agent: Harbor & Vine, this is June. How can I help?\n"
     "Caller: Table for four on Friday, around eight?\n"
     "Agent: I have 8:00pm on the terrace or 7:45pm inside.\n"
     "Caller: Terrace, and one of us is gluten-free.\n"
     "Agent: Noted on the reservation — see you Friday."),
    (1, 19, 5, "Jonah Pike", "+1 (917) 555-0108", 96, "Inquiry",
     "Asked about the tasting menu price and whether walk-ins are welcome at the bar.",
     "Agent: Harbor & Vine, this is June.\n"
     "Caller: What's the tasting menu?\n"
     "Agent: Seven courses at $95 per person, wine pairing $55.\n"
     "Caller: Do you take walk-ins?\n"
     "Agent: The bar keeps six seats for walk-ins from 5pm."),
    (2, 20, 44, "Marta Nowak", "+1 (212) 555-0166", 63, "Missed",
     "Called after the kitchen closed and hung up.",
     "Agent: Harbor & Vine is closed for the evening. We reopen at 5pm.\n"
     "[call ended by caller]"),
    (4, 17, 12, "Chris Delgado", "+1 (646) 555-0133", 208, "Booked",
     "Booked a birthday dinner for eight on Saturday at 7:00pm with a cake request.",
     "Agent: Harbor & Vine, this is June.\n"
     "Caller: Birthday dinner for eight on Saturday.\n"
     "Agent: 7:00pm works. Shall I arrange a cake?\n"
     "Caller: Yes, chocolate if you have it.\n"
     "Agent: Booked with a chocolate cake note for the kitchen."),
    (6, 12, 30, "Ava Bennett", "+1 (212) 555-0188", 118, "Inquiry",
     "Asked about private dining minimums for a 20-person event.",
     "Agent: Harbor & Vine, this is June.\n"
     "Caller: Can you host 20 people privately?\n"
     "Agent: Yes — the cellar room seats 22 with a $1,800 minimum on weekends.\n"
     "Caller: I'll email the events team.\n"
     "Agent: I'll pass your number along so they can follow up."),
]

HARBOR_APPOINTMENTS = [
    (2, 20, 0, "Elena Rossi", "+1 (212) 555-0141", "Dinner for 4 — terrace", "Scheduled"),
    (3, 19, 0, "Chris Delgado", "+1 (646) 555-0133", "Birthday dinner for 8", "Scheduled"),
    (-3, 18, 30, "Jonah Pike", "+1 (917) 555-0108", "Bar tasting menu for 2", "Completed"),
]


def _at(days_from_today: int, hour: int, minute: int):
    moment = utcnow() + timedelta(days=days_from_today)
    return moment.replace(hour=hour, minute=minute, second=0, microsecond=0)


def _seed_workspace(db: Session, *, company: Company, user: dict, calls: list, appointments: list) -> None:
    db.add(company)
    db.flush()

    db.add(
        User(
            email=user["email"],
            name=user["name"],
            password_hash=hash_password(DEMO_PASSWORD),
            role="owner",
            company_id=company.id,
        )
    )

    for days, hour, minute, name, phone, duration, outcome, summary, transcript in calls:
        db.add(
            CallLog(
                company_id=company.id,
                caller_name=name,
                caller_phone=phone,
                duration_seconds=duration,
                summary=summary,
                transcript=transcript,
                recording_url="",
                outcome=outcome,
                occurred_at=_at(-days, hour, minute),
            )
        )

    for days, hour, minute, customer, phone, service, status in appointments:
        db.add(
            Appointment(
                company_id=company.id,
                customer_name=customer,
                phone=phone,
                service=service,
                scheduled_at=_at(days, hour, minute),
                status=status,
            )
        )


def seed_demo_data(db: Session) -> None:
    existing = db.execute(select(User.email)).scalars().all()
    if existing:
        return

    northline = Company(
        name="Northline Dental Studio",
        industry="Dental care",
        phone_number="+1 (415) 555-0142",
        greeting_script=(
            "Thanks for calling Northline Dental Studio, this is Ava, the practice's virtual "
            "receptionist. I can book appointments, answer questions about insurance, or take a "
            "message for the clinical team. How can I help you today?"
        ),
        business_hours=[
            {"day": "Monday", "open": "08:30", "close": "17:30", "closed": False},
            {"day": "Tuesday", "open": "08:30", "close": "17:30", "closed": False},
            {"day": "Wednesday", "open": "08:30", "close": "17:30", "closed": False},
            {"day": "Thursday", "open": "08:30", "close": "19:00", "closed": False},
            {"day": "Friday", "open": "08:30", "close": "17:30", "closed": False},
            {"day": "Saturday", "open": "09:00", "close": "13:00", "closed": False},
            {"day": "Sunday", "open": "09:00", "close": "13:00", "closed": True},
        ],
        faqs=[
            {"question": "Which insurance providers do you accept?",
             "answer": "We are in network with Delta Dental PPO, Aetna, MetLife and Cigna. For others we bill as out-of-network."},
            {"question": "How much does a new patient visit cost?",
             "answer": "A new patient exam, x-rays and cleaning is $149 without insurance."},
            {"question": "Do you handle dental emergencies?",
             "answer": "Yes. We hold two same-day slots each weekday morning for urgent pain or trauma."},
            {"question": "Where can I park?",
             "answer": "Validated parking is available in the garage on Pine Street, one block from the office."},
        ],
        calendar_link="https://cal.com/northline-dental",
        subscription_status="active",
        plan="growth",
    )

    harbor = Company(
        name="Harbor & Vine Bistro",
        industry="Restaurant",
        phone_number="+1 (212) 555-0199",
        greeting_script=(
            "You've reached Harbor & Vine. I'm June, the virtual host — I can reserve a table, "
            "share our hours and menu highlights, or take a message for the events team."
        ),
        business_hours=[
            {"day": "Monday", "open": "17:00", "close": "22:00", "closed": True},
            {"day": "Tuesday", "open": "17:00", "close": "22:00", "closed": False},
            {"day": "Wednesday", "open": "17:00", "close": "22:00", "closed": False},
            {"day": "Thursday", "open": "17:00", "close": "23:00", "closed": False},
            {"day": "Friday", "open": "17:00", "close": "23:30", "closed": False},
            {"day": "Saturday", "open": "16:00", "close": "23:30", "closed": False},
            {"day": "Sunday", "open": "16:00", "close": "21:00", "closed": False},
        ],
        faqs=[
            {"question": "Do you take walk-ins?", "answer": "The bar keeps six seats for walk-ins from 5pm."},
            {"question": "Is there a dress code?", "answer": "Smart casual. Jackets are not required."},
        ],
        calendar_link="https://cal.com/harbor-vine",
        subscription_status="trialing",
        plan="starter",
    )

    _seed_workspace(
        db,
        company=northline,
        user={"email": "demo@northline.ai", "name": "Dana Whitmore"},
        calls=NORTHLINE_CALLS,
        appointments=NORTHLINE_APPOINTMENTS,
    )
    _seed_workspace(
        db,
        company=harbor,
        user={"email": "marina@harborvine.ai", "name": "Marina Costa"},
        calls=HARBOR_CALLS,
        appointments=HARBOR_APPOINTMENTS,
    )
    db.commit()
    log.info("Seeded demo workspaces")
