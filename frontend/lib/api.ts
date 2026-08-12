const API_URL = process.env.NEXT_PUBLIC_SIGNAL_API || "http://localhost:8000";

export interface Point {
  date: string;
  price: number;
  lower?: number;
  upper?: number;
}

export interface ForecastResult {
  history: Point[];
  forecast: Point[];
  metrics: {
    mae: number;
    mape: number;
    train_points: number;
    horizon_days: number;
  };
}

export async function getForecast(): Promise<ForecastResult> {
  const res = await fetch(`${API_URL}/api/forecast`);
  if (!res.ok) throw new Error((await res.json()).detail || "Forecast failed");
  return res.json();
}
