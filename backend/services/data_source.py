from datetime import datetime, timezone

import httpx

from core.config import settings


def fetch_history() -> list[dict]:
    url = f"{settings.coingecko_base}/coins/bitcoin/market_chart"
    params = {
        "vs_currency": "usd",
        "days": settings.history_days,
        "interval": "daily",
    }
    headers = {}
    if settings.coingecko_api_key:
        headers["x-cg-demo-api-key"] = settings.coingecko_api_key

    with httpx.Client(timeout=settings.request_timeout) as client:
        resp = client.get(url, params=params, headers=headers)
        resp.raise_for_status()
        prices = resp.json().get("prices", [])

    return [
        {
            "date": datetime.fromtimestamp(ts / 1000, tz=timezone.utc).strftime("%Y-%m-%d"),
            "price": float(price),
        }
        for ts, price in prices
    ]
