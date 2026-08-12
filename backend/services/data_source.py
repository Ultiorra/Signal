from datetime import datetime, timezone

import httpx

from core.config import settings


def _from_coingecko() -> list[dict]:
    url = f"{settings.coingecko_base}/coins/bitcoin/market_chart"
    params = {"vs_currency": "usd", "days": settings.history_days, "interval": "daily"}
    with httpx.Client(timeout=settings.request_timeout) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
        prices = resp.json().get("prices", [])
    return [
        {
            "date": datetime.fromtimestamp(ts / 1000, tz=timezone.utc).strftime("%Y-%m-%d"),
            "price": float(price),
        }
        for ts, price in prices
    ]


def _from_coinpaprika() -> list[dict]:
    url = f"{settings.coinpaprika_base}/tickers/btc-bitcoin/historical"
    start = "2024-01-01"
    params = {"start": start, "interval": "1d"}
    with httpx.Client(timeout=settings.request_timeout) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
    return [
        {"date": row["timestamp"][:10], "price": float(row["price"])}
        for row in data
    ]


def fetch_history() -> list[dict]:
    try:
        series = _from_coingecko()
        if series:
            return series
    except Exception:
        pass
    return _from_coinpaprika()
