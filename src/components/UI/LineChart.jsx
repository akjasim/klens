import React from "react";
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const DATA = [];

function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function MinimalTooltip({ active, payload, label, valueLabel }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;

  return (
    <div
      className="rounded shadow-md bg-white px-3 py-2 text-sm"
      style={{ minWidth: 120 }}
    >
      <div className="text-slate-500 text-xs">Year</div>
      <div className="font-medium">{p.year}</div>

      <div className="mt-1 text-slate-500 text-xs">{valueLabel}</div>
      <div className="font-semibold">{formatNumber(p.value)}</div>
    </div>
  );
}

export default function LineChart({
  data = DATA,
  height = 280,
  title = "Population (1995–2022)",
  subtitle = "Absolute counts",
  valueLabel = "Population",
  unitLabel = "people",
}) {
  // Determine reasonable Y axis ticks by rounding to nearest 1000
  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const padding = Math.ceil((max - min) * 0.08) || 1000;
  const domainTop = Math.ceil((max + padding) / 1000) * 1000;
  const domainBottom = Math.floor((min - padding) / 1000) * 1000;

  return (
    <div
      className="w-full rounded-md p-4 bg-white border"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          {/* <h3 className="text-sm text-slate-700 font-semibold">{title}</h3> */}
          {/* <div className="text-xs text-slate-400">{subtitle}</div> */}
        </div>
        <div className="text-xs text-slate-500">Units: {unitLabel}</div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart
            data={data}
            margin={{ top: 8, right: 12, left: 4, bottom: 6 }}
          >
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#475569" }}
              interval={3}
            />

            <YAxis
              domain={[domainBottom, domainTop]}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatNumber(v)}
              tick={{ fontSize: 12, fill: "#475569" }}
            />

            <Tooltip
              content={<MinimalTooltip valueLabel={valueLabel} />}
              cursor={false}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#0f172a"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ReLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
