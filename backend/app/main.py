import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from app.config import get_settings
from app.database import create_db_and_tables
from app.models import Episode, Source, Task, TranscriptLine, User  # noqa: F401 — register tables
from app.routers import auth, episodes, generate, onboarding, tasks

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


settings = get_settings()

app = FastAPI(title="Your Podcast API", lifespan=lifespan)

# SessionMiddleware is required by authlib for OAuth state storage
app.add_middleware(SessionMiddleware, secret_key=settings.session_secret)

origins = [
    "http://localhost:3000",
    settings.frontend_url,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in origins if o],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(episodes.router)
app.include_router(generate.router)
app.include_router(tasks.router)


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.2.0"}
