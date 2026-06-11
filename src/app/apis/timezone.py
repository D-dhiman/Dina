from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pytz
import httpx

app = FastAPI(
    title="DateTime API",
    description="Fetch current date and time using IP-based location detection",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


async def get_ip_geo(ip: str) -> dict:
    """Fetch timezone + location from ip-api.com for a given IP."""
    # If localhost/private IP, omit the IP so ip-api uses the server's public IP
    private = ("127.", "192.168.", "10.", "172.", "::1", "")
    if any(ip.startswith(p) for p in private):
        url = "http://ip-api.com/json/?fields=timezone,country,city,regionName,lat,lon,query"
    else:
        url = f"http://ip-api.com/json/{ip}?fields=timezone,country,city,regionName,lat,lon,query"

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(url)
            return resp.json()
    except Exception:
        return {}


def build_response(geo: dict) -> dict:
    tz_name = geo.get("timezone") or "UTC"

    try:
        tz = pytz.timezone(tz_name)
    except pytz.UnknownTimeZoneError:
        tz = pytz.utc
        tz_name = "UTC"

    now = datetime.now(tz)

    return {
        "source": "ip",
        "detected_ip": geo.get("query", "unknown"),
        "city": geo.get("city", "Unknown"),
        "region": geo.get("regionName", "Unknown"),
        "country": geo.get("country", "Unknown"),
        "latitude": geo.get("lat"),
        "longitude": geo.get("lon"),
        "timezone": tz_name,
        "utc_offset": now.strftime("%z"),
        "datetime": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
        "day_of_week": now.strftime("%A"),
        "timestamp_utc": datetime.utcnow().isoformat() + "Z",
    }


@app.get("/datetime/auto", summary="Get current date & time (auto-detected from IP)")
async def get_datetime_auto(request: Request):
    """
    No parameters needed. Detects location and timezone from the caller's IP
    and returns the current local date & time.
    """
    client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    if not client_ip:
        client_ip = request.client.host if request.client else ""

    geo = await get_ip_geo(client_ip)
    return build_response(geo)


@app.get("/timezones", summary="List available timezones")
async def list_timezones(search: str = Query(default=None, description="Filter by keyword")):
    zones = pytz.all_timezones
    if search:
        zones = [z for z in zones if search.lower() in z.lower()]
    return {"count": len(zones), "timezones": zones}


@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": "DateTime API v3 is running",
        "docs": "/docs",
        "endpoints": {
            "auto": "GET /datetime/auto",
            "zones": "GET /timezones?search=Asia",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("timezone:app", host="0.0.0.0", port=8000, reload=True)