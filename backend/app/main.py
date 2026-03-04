import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from app.config import get_settings
from app.routers import auth, episodes, generate, onboarding, tasks

logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Close the shared D1 client if it was created
    from app.database import _d1_client
    if _d1_client is not None:
        await _d1_client.aclose()


app = FastAPI(title="Your Podcast API", lifespan=lifespan)

# SessionMiddleware is required by authlib for OAuth state storage
app.add_middleware(SessionMiddleware, secret_key=settings.session_secret)

origins = [
    "http://localhost:3000",
    "https://your-podcast.vercel.app",
    os.getenv("FRONTEND_URL", ""),
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
    return {"status": "ok", "version": "0.2.1"}
