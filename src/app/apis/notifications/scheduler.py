"""
notifications/scheduler.py
---------------------------
Background jobs that check dailies, medications, calendar plans, and
wellness assessments every minute and send Web Push notifications
when something is due. Uses the existing dina pool from database.py —
no separate connection pool is created here.
"""

import os
import json
from datetime import datetime, timedelta, date, time as dtime

from pywebpush import webpush, WebPushException
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from database import get_dina_pool

VAPID_PRIVATE_KEY_PATH = os.environ["VAPID_PRIVATE_KEY_PATH"]
VAPID_SUBJECT = os.environ["VAPID_SUBJECT"]


async def send_push(pool, user_id, title, body, url="/dashboard", ttl=3600):
    subs = await pool.fetch(
        "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1",
        user_id,
    )
    for s in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": s["endpoint"],
                    "keys": {"p256dh": s["p256dh"], "auth": s["auth"]},
                },
                data=json.dumps({"title": title, "body": body, "url": url}),
                vapid_private_key=VAPID_PRIVATE_KEY_PATH,
                vapid_claims={"sub": VAPID_SUBJECT},
                ttl=ttl,
            )
        except WebPushException as ex:
            if "410" in str(ex) or "404" in str(ex):
                await pool.execute(
                    "DELETE FROM push_subscriptions WHERE endpoint = $1", s["endpoint"]
                )
            else:
                print("[push] error:", ex)


async def already_sent(pool, ref_type, ref_id, notify_key):
    row = await pool.fetchrow(
        "SELECT 1 FROM notification_log WHERE ref_type=$1 AND ref_id=$2 AND notify_key=$3",
        ref_type, ref_id, notify_key,
    )
    return row is not None


async def mark_sent(pool, user_id, ref_type, ref_id, notify_key):
    await pool.execute(
        """INSERT INTO notification_log (user_id, ref_type, ref_id, notify_key)
           VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING""",
        user_id, ref_type, ref_id, notify_key,
    )


# ---------- 1. Calendar plans: T-2 days through day-of, once/day at 09:00 ----------
async def check_calendar_plans():
    pool = await get_dina_pool()
    now = datetime.now()
    if now.hour != 9:
        return
   
    today = date.today()
    rows = await pool.fetch(
        """SELECT id, user_id, plan_date, label FROM calendar_plans
           WHERE plan_date BETWEEN $1 AND $2""",
        today, today + timedelta(days=2),
    )
    for r in rows:
        key = today.isoformat()
        if await already_sent(pool, "calendar_plan", str(r["id"]), key):
            continue
        days_left = (r["plan_date"] - today).days
        when = "today" if days_left == 0 else f"in {days_left} day(s)"
        await send_push(pool, r["user_id"], "Upcoming plan", f"{r['label']} is {when}", ttl=86400)
        await mark_sent(pool, r["user_id"], "calendar_plan", str(r["id"]), key)


# ---------- 2. Dailies: last_time_to_do - 2h, skip if already completed ----------
async def check_dailies():
    pool = await get_dina_pool()
    now = datetime.now()
    today = date.today()
    rows = await pool.fetch(
        "SELECT id, user_id, habit_name, last_time_to_do FROM dailies WHERE active = true"
    )
    for r in rows:
        last_time = r["last_time_to_do"] or dtime(22, 0)
        reminder_dt = datetime.combine(today, last_time) - timedelta(hours=2)
        if not (reminder_dt <= now < reminder_dt + timedelta(minutes=2)):
            continue
        key = today.isoformat()
        if await already_sent(pool, "daily", str(r["id"]), key):
            continue
        done = await pool.fetchrow(
            """SELECT is_completed FROM daily_completions
               WHERE daily_id = $1 AND completion_date = $2""",
            r["id"], today,
        )
        if done and done["is_completed"]:
            await mark_sent(pool, r["user_id"], "daily", str(r["id"]), key)
            continue
        await send_push(pool, r["user_id"], "Daily reminder", f"Don't forget: {r['habit_name']}", ttl=3600)
        await mark_sent(pool, r["user_id"], "daily", str(r["id"]), key)


# ---------- 3. Medications: exact time ----------
async def check_medications():
    pool = await get_dina_pool()
    now = datetime.now()
    today = date.today()
    rows = await pool.fetch(
        "SELECT id, user_id, name, dose, consumption_time FROM medications WHERE active = true"
    )
    for r in rows:
        ct = r["consumption_time"]
        if not ct:
            continue
        target = datetime.combine(today, ct)
        if not (target <= now < target + timedelta(minutes=2)):
            continue
        key = today.isoformat()
        if await already_sent(pool, "medication", str(r["id"]), key):
            continue
        await send_push(pool, r["user_id"], "Medication time", f"Take {r['name']} — {r['dose']}", ttl=300)
        await mark_sent(pool, r["user_id"], "medication", str(r["id"]), key)


# ---------- 4. Assessments: every 30 days, + auto-add to calendar ----------
async def check_assessments():
    pool = await get_dina_pool()
    now = datetime.now()
    if now.hour != 9:
        return
    
    today = date.today()
    users = await pool.fetch(
        """SELECT DISTINCT ON (user_id) user_id, created_at
           FROM wellness_assessments
           ORDER BY user_id, created_at DESC"""
    )
    for u in users:
        due_date = (u["created_at"] + timedelta(days=30)).date()
        if due_date != today:
            continue
        key = due_date.isoformat()
        if await already_sent(pool, "assessment", str(u["user_id"]), key):
            continue

        await pool.execute(
            """INSERT INTO calendar_plans (user_id, plan_date, label, color)
               VALUES ($1, $2, $3, $4)""",
            u["user_id"], due_date, "Wellness assessment due", "bg-fuchsia-400",
        )
        await send_push(pool, u["user_id"], "Time for your check-in", "Your 30-day wellness assessment is due", ttl=86400)
        await mark_sent(pool, u["user_id"], "assessment", str(u["user_id"]), key)


# ---------- scheduler lifecycle ----------
_scheduler: AsyncIOScheduler | None = None


def start_scheduler():
    global _scheduler
    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(check_calendar_plans, "interval", minutes=1)
    _scheduler.add_job(check_dailies, "interval", minutes=1)
    _scheduler.add_job(check_medications, "interval", minutes=1)
    _scheduler.add_job(check_assessments, "interval", minutes=1)
    _scheduler.start()
    print("[scheduler] ✓ started (calendar, dailies, medications, assessments)")


def stop_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        print("[scheduler] stopped")