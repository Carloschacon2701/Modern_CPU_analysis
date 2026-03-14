"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Series {
  dataKey: string;
  color: string;
  name?: string;
  unit?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TimeSeriesChartProps {
  data: any[];
  series: Series[];
  height?: number;
  domain?: [number | string, number | string];
  unit?: string;
  formatter?: (value: number) => string;
}

export function TimeSeriesChart({
  data,
  series,
  height = 200,
  domain = [0, 100],
  unit = "",
  formatter,
}: TimeSeriesChartProps) {
  const fmt = formatter ?? ((v: number) => `${v.toFixed(1)}${unit}`);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="timestamp" hide />
        <YAxis
          domain={domain}
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}${unit}`}
          width={44}
        />
        <Tooltip
          contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
          labelStyle={{ color: "#9ca3af", fontSize: 11 }}
          itemStyle={{ color: "#e5e7eb", fontSize: 12 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => fmt(Number(value))}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />}
        {series.map((s) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            stroke={s.color}
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
            name={s.name ?? s.dataKey}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
