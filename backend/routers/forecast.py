from fastapi import APIRouter, HTTPException

from services.data_source import fetch_history
from services.forecaster import train_and_forecast

router = APIRouter(prefix="/api", tags=["forecast"])


@router.get("/forecast")
def forecast():
    try:
        series = fetch_history()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Data source error: {exc}") from exc
    if len(series) < 60:
        raise HTTPException(status_code=502, detail="Not enough history to model.")
    try:
        result = train_and_forecast(series)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Modeling error: {exc}") from exc
    return result
