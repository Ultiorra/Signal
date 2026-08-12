"use client";

import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ForecastResult } from "../lib/api";

interface Row {
  date: string;
  history?: number;
  forecast?: number;
  band?: [number, number];
}

function build(data: ForecastResult): Row[] {
  const rows: Row[] = data.history.map((p) => ({ date: p.date, history: p.price }));
  const lastHist = data.history[data.history.length - 1];
  rows.push({ date: lastHist.date, forecast: lastHist.price, band: [lastHist.price, lastHist.price] });
  for (const p of data.forecast) {
    rows.push({
      date: p.date,
      forecast: p.price,
      band: [p.lower ?? p.price, p.upper ?? p.price],
    });
  }
  return rows;
}

function fmtUsd(v: number): string {
  return `$${Math.round(v).toLocaleString()}`;
}

function fmtDate(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ForecastChart({ data }: { data: ForecastResult }) {
  const rows = build(data);
  const step = Math.ceil(rows.length / 8);

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={rows} margin={{ top: 10, right: 16, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id="hist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2b2a6b" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#2b2a6b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            interval={step}
            tick={{ fontSize: 11, fill: "#6b6f78", fontFamily: "var(--font-mono)" }}
            stroke="#d4cfc2"
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: "#6b6f78", fontFamily: "var(--font-mono)" }}
            stroke="#d4cfc2"
            width={52}
            domain={["auto", "auto"]}
          />
          <Tooltip
            formatter={(value: number | number[], name: string) => {
              if (Array.isArray(value)) {
                return [`${fmtUsd(value[0])} to ${fmtUsd(value[1])}`, "95% interval"];
              }
              return [fmtUsd(value), name === "history" ? "Actual" : "Forecast"];
            }}
            labelFormatter={fmtDate}
            contentStyle={{
              background: "#fbfaf7",
              border: "1px solid #d4cfc2",
              borderRadius: 8,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
          />
          <Area
            dataKey="band"
            stroke="none"
            fill="#e8623d"
            fillOpacity={0.14}
            isAnimationActive={false}
          />
          <Area
            dataKey="history"
            stroke="#2b2a6b"
            strokeWidth={2}
            fill="url(#hist)"
            isAnimationActive={false}
          />
          <Line
            dataKey="forecast"
            stroke="#e8623d"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
