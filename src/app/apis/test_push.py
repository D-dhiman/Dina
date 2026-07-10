"""
One-off test script to send a push notification immediately,
without waiting for the scheduler's time-window conditions.
Run with: python test_push.py
"""
import asyncio
import os
import json
import asyncpg
from pywebpush import webpush, WebPushException


def _load_env():
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

_load_env()

VAPID_PRIVATE_KEY_PATH = os.environ["VAPID_PRIVATE_KEY_PATH"]
VAPID_SUBJECT = os.environ["VAPID_SUBJECT"]


async def main():
    conn = await asyncpg.connect(os.environ["DATABASE_URL"])
    subs = await conn.fetch("SELECT endpoint, p256dh, auth FROM push_subscriptions")
    print(f"Found {len(subs)} subscription(s)")

    for s in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": s["endpoint"],
                    "keys": {"p256dh": s["p256dh"], "auth": s["auth"]},
                },
                data=json.dumps({
                    "title": "Test notification",
                    "body": "If you see this, push is working! 🎉",
                    "url": "/dashboard",
                }),
                vapid_private_key=VAPID_PRIVATE_KEY_PATH,
                vapid_claims={"sub": VAPID_SUBJECT},
                ttl=60,
            )
            print("✓ Push sent successfully")
        except WebPushException as ex:
            print("✗ Push failed:", ex)
            if ex.response is not None:
                print("  status_code:", ex.response.status_code)
                print("  response text:", ex.response.text)
                print("  response headers:", dict(ex.response.headers))

    await conn.close()


asyncio.run(main())