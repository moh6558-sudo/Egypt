import logging
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy.exc import OperationalError

from .db import Base, SessionLocal, engine
from .routers import appointments, auth, billing, call_logs, company, dashboard
from .seed import seed_demo_data

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("portal")


def init_db() -> None:
    for attempt in range(30):
        try:
            Base.metadata.create_all(engine)
            break
        except OperationalError as exc:  # database still starting
            if attempt == 29:
                raise
            log.warning("Database not ready (%s), retrying", exc.__class__.__name__)
            time.sleep(2)

    with SessionLocal() as db:
        seed_demo_data(db)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Portal API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.include_router(auth.router)
app.include_router(company.router)
app.include_router(call_logs.router)
app.include_router(appointments.router)
app.include_router(dashboard.router)
app.include_router(billing.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "env": os.environ.get("APP_ENV", "development")}
