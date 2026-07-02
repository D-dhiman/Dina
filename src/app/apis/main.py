import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Relative imports targeting your local routers directory layout
from routers import twin, timezone

# Initialize the main FastAPI application context
app = FastAPI(
    title="Dina Core Predictive Engine",
    description="Digital Twin and Timezone routing matrix for CCRAS tracking.",
    version="1.0.0"
)

# -------------------------------------------------------------------------
# CORS MIDDLEWARE CONFIGURATION
# Ensures Next.js (port 3000) isn't blocked by the browser when fetching metrics
# -------------------------------------------------------------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all standard HTTP verbs (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all required layout headers (Content-Type, Authorization)
)

# -------------------------------------------------------------------------
# ROUTER MOUNTING/REGISTRATION
# Wire up your logic engines found inside your routers folder
# -------------------------------------------------------------------------
# Mounts the Digital Twin engine logic under: /twin/...
app.include_router(twin.router, prefix="/twin", tags=["Digital Twin Assessing Pipeline"])

# Mounts the Timezone calculations logic under: /timezone/...
app.include_router(timezone.router, prefix="/timezone", tags=["Time Utility Engine"])


# -------------------------------------------------------------------------
# BASE STATUS ENDPOINTS
# -------------------------------------------------------------------------
@app.get("/", tags=["Global Healthcheck"])
async def read_root():
    """
    Base service health monitoring check.
    """
    return {
        "status": "active",
        "service": "Dina FastAPI Core Engine",
        "interactive_docs": "/docs"
    }


# -------------------------------------------------------------------------
# ENGINE LAUNCH EXECUTION STRATEGY
# -------------------------------------------------------------------------
if __name__ == "__main__":
    # Boots up local uvicorn worker thread matrix bound to port 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)