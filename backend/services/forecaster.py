import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error

from core.config import settings

LAGS = [1, 2, 3, 7, 14, 30]
ROLL_WINDOWS = [7, 14, 30]


def _build_features(prices: pd.Series) -> pd.DataFrame:
    df = pd.DataFrame({"price": prices})
    df["return_1"] = df["price"].pct_change()
    for lag in LAGS:
        df[f"lag_{lag}"] = df["price"].shift(lag)
    for win in ROLL_WINDOWS:
        df[f"ma_{win}"] = df["price"].rolling(win).mean()
        df[f"std_{win}"] = df["price"].rolling(win).std()
    df["dayofweek"] = np.arange(len(df)) % 7
    return df


def _feature_row(history: list[float]) -> dict:
    s = pd.Series(history)
    row = {"return_1": s.pct_change().iloc[-1]}
    for lag in LAGS:
        row[f"lag_{lag}"] = s.iloc[-lag] if len(s) >= lag else s.iloc[0]
    for win in ROLL_WINDOWS:
        window = s.iloc[-win:]
        row[f"ma_{win}"] = window.mean()
        row[f"std_{win}"] = window.std() if len(window) > 1 else 0.0
    row["dayofweek"] = (len(s) - 1) % 7
    return row


def train_and_forecast(series: list[dict]) -> dict:
    dates = [d["date"] for d in series]
    prices = pd.Series([d["price"] for d in series], dtype="float64")

    feats = _build_features(prices)
    target = prices.shift(-1)

    data = feats.copy()
    data["target"] = target
    data = data.dropna()

    feature_cols = [c for c in feats.columns if c != "price"]
    x = data[feature_cols].values
    y = data["target"].values

    split = int(len(x) * 0.85)
    x_train, x_val = x[:split], x[split:]
    y_train, y_val = y[:split], y[split:]

    model = GradientBoostingRegressor(
        n_estimators=300,
        max_depth=3,
        learning_rate=0.05,
        subsample=0.9,
        random_state=42,
    )
    model.fit(x_train, y_train)

    val_pred = model.predict(x_val)
    mae = float(mean_absolute_error(y_val, val_pred))
    residual_std = float(np.std(y_val - val_pred)) if len(y_val) > 1 else mae

    model.fit(x, y)

    horizon = settings.forecast_horizon
    working = list(prices.values)
    last_date = pd.to_datetime(dates[-1])
    forecast = []
    for step in range(1, horizon + 1):
        row = _feature_row(working)
        x_next = np.array([[row[c] for c in feature_cols]])
        pred = float(model.predict(x_next)[0])
        working.append(pred)
        drift = residual_std * np.sqrt(step)
        forecast.append(
            {
                "date": (last_date + pd.Timedelta(days=step)).strftime("%Y-%m-%d"),
                "price": pred,
                "lower": pred - 1.96 * drift,
                "upper": pred + 1.96 * drift,
            }
        )

    return {
        "history": series,
        "forecast": forecast,
        "metrics": {
            "mae": round(mae, 2),
            "mape": round(float(np.mean(np.abs((y_val - val_pred) / y_val)) * 100), 2),
            "train_points": len(x),
            "horizon_days": horizon,
        },
    }
