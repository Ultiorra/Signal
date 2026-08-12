"use client";

import { useEffect, useState } from "react";
import { getForecast, ForecastResult } from "../lib/api";
import ForecastChart from "../components/ForecastChart";

export default function ForecastPage() {
  const [data, setData] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(refresh = false) {
    setLoading(true);
    setError("");
    try {
      setData(await getForecast(refresh));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load forecast");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="sig">
      <header className="sig-head">
        <span className="sig-kicker">Predictive ML · time series</span>
        <h1>Bitcoin forecast, with its uncertainty shown.</h1>
        <p>
          A scikit-learn model trained on a year of real BTC data. It projects
          the next two weeks and, just as importantly, draws the confidence band
          around that projection. Markets aren&apos;t really predictable, so the
          point here is an honest pipeline and a clear reading of the data.
        </p>
      </header>

      {loading && <div className="sig-status">Fetching data and training the model…</div>}
      {error && <div className="sig-error">{error}</div>}

      {data && (
        <>
          <div className="sig-metrics">
            <div className="metric">
              <span className="metric-val">${data.history[data.history.length - 1].price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span className="metric-label">Latest close</span>
            </div>
            <div className="metric">
              <span className="metric-val">{data.metrics.mape}%</span>
              <span className="metric-label">Validation MAPE</span>
            </div>
            <div className="metric">
              <span className="metric-val">{data.metrics.horizon_days}d</span>
              <span className="metric-label">Forecast horizon</span>
            </div>
            <div className="metric">
              <span className="metric-val">{data.metrics.train_points}</span>
              <span className="metric-label">Training points</span>
            </div>
          </div>

          <ForecastChart data={data} />

          <div className="sig-legend">
            <span><i className="swatch hist" /> Actual price</span>
            <span><i className="swatch fc" /> Forecast</span>
            <span><i className="swatch band" /> 95% confidence interval</span>
          </div>

          <p className="sig-note">
            Features: lagged prices (1 to 30 days), rolling means and volatility,
            and day-of-week. Model: gradient-boosted trees. The band widens with
            the horizon because uncertainty compounds the further out you predict.
          </p>

          <button className="sig-refresh" onClick={() => load(true)}>Re-run with latest data</button>
        </>
      )}
    </main>
  );
}
