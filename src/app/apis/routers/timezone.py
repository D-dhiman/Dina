"""
routers/timezone.py
--------------------
Geolocation-based date/time endpoints.

Endpoints:
    GET /datetime/geo?lat=..&lon=..
        Resolves IANA timezone offline from coordinates (timezonefinder) and
        best-effort reverse-geocodes city/region/country via Open-Meteo.

    GET /datetime/timezones?search=..
        Lists/filters all available IANA timezone names.
"""

from datetime import datetime

import httpx
import pytz
from fastapi import APIRouter, Query
from timezonefinder import TimezoneFinder

router = APIRouter()
tf = TimezoneFinder()


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def resolve_timezone(lat: float, lon: float) -> str:
    """Resolve IANA timezone name from coordinates using local offline lookup."""
    tz_name = tf.timezone_at(lat=lat, lng=lon)
    return tz_name or "UTC"


async def reverse_geocode(lat: float, lon: float) -> dict:
    """Fetch city/region/country for given coordinates via Open-Meteo's geocoding service."""
    url = "https://geocoding-api.open-meteo.com/v1/reverse"
    params = {"latitude": lat, "longitude": lon, "language": "en", "format": "json"}

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(url, params=params)
            data = resp.json()
            results = data.get("results") or []
            if results:
                place = results[0]
                return {
                    "city": place.get("name", "Unknown"),
                    "region": place.get("admin1", "Unknown"),
                    "country": place.get("country", "Unknown"),
                }
    except Exception:
        pass

    return {"city": "Unknown", "region": "Unknown", "country": "Unknown"}


def build_response(lat: float, lon: float, place: dict) -> dict:
    tz_name = resolve_timezone(lat, lon)

    try:
        tz = pytz.timezone(tz_name)
    except pytz.UnknownTimeZoneError:
        tz = pytz.utc
        tz_name = "UTC"

    now = datetime.now(tz)

    return {
        "source": "geolocation",
        "latitude": lat,
        "longitude": lon,
        "city": place.get("city", "Unknown"),
        "region": place.get("region", "Unknown"),
        "country": place.get("country", "Unknown"),
        "timezone": tz_name,
        "utc_offset": now.strftime("%z"),
        "datetime": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
        "day_of_week": now.strftime("%A"),
        "timestamp_utc": datetime.utcnow().isoformat() + "Z",
    }


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/geo", summary="Get current date & time from latitude/longitude")
async def get_datetime_geo(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
):
    """
    Pass `lat` and `lon` query params. Resolves timezone offline from coordinates
    and (best-effort) reverse-geocodes city/region/country via Open-Meteo.
    """
    place = await reverse_geocode(lat, lon)
    return build_response(lat, lon, place)


@router.get("/timezones", summary="List available timezones")
async def list_timezones(search: str = Query(default=None, description="Filter by keyword")):
    zones = pytz.all_timezones
    if search:
        zones = [z for z in zones if search.lower() in z.lower()]
    return {"count": len(zones), "timezones": zones}