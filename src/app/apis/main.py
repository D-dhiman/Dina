"""
main.py
-------
FastAPI application entry point for the Ayurveda Digital Twin backend.

Initializes both DB pools at startup via lifespan, registers all routers,
and exposes a health check at GET /health.

Run locally:
    uvicorn main:app --reload --port 8000

.env must contain:
    DATABASE_URL        = postgresql://user:password@host:port/dina
    DATABASE_URL_RULES  = postgresql://user:password@host:port/aura_wellness
    GROQ_API_KEY        = your-groq-key
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_pools, close_pools
from routers import twin

from routers import timezone 


# ─────────────────────────────────────────────────────────────────────────────
# .env LOADER
# Walks up from this file's directory to find .env in the project root.
# Same logic as run_twin.py so both entry points share one .env file.
# ─────────────────────────────────────────────────────────────────────────────

def _load_dotenv():
    import os as _os
    current = _os.path.dirname(_os.path.abspath(__file__))
    for _ in range(5):
        candidate = _os.path.join(current, ".env")
        if _os.path.exists(candidate):
            try:
                from dotenv import load_dotenv
                load_dotenv(candidate)
                return
            except ImportError:
                pass
            # Manual fallback parser
            with open(candidate, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, _, value = line.partition("=")
                    key   = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key and key not in _os.environ:
                        _os.environ[key] = value
            return
        parent = _os.path.dirname(current)
        if parent == current:
            break
        current = parent

_load_dotenv()


# ─────────────────────────────────────────────────────────────────────────────
# LIFESPAN  (replaces deprecated @app.on_event)
# Both pools are created here so they're ready before any request arrives.
# ─────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── startup ───────────────────────────────────────────────────────────────
    print("[startup] Initializing database pools...")
    await init_pools()
    print("[startup] Ready.")
    yield
    # ── shutdown ──────────────────────────────────────────────────────────────
    print("[shutdown] Closing database pools...")
    await close_pools()
    print("[shutdown] Done.")


# ─────────────────────────────────────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Ayurveda Digital Twin API",
    description="LLM-powered Ayurvedic health assessment, forecasting, and habit management.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — adjust origins for your Next.js frontend URL in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev server
        "http://localhost:3001",
        os.environ.get("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# ROUTERS
# ─────────────────────────────────────────────────────────────────────────────

app.include_router(twin.router, prefix="/twin", tags=["Digital Twin"])
app.include_router(timezone.router, prefix="/datetime", tags=["DateTime"])


# ─────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ayurveda-digital-twin"}