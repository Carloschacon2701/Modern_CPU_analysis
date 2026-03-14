"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { percentColor } from "@/lib/format-utils";

interface GaugeChartProps {
  value: number;
  max?: number;
  label?: string;
  size?: number;
}

export function GaugeChart({ value, max = 100, label, size = 120 }: GaugeChartProps) {
  const pct = Math.min(100, (value / max) * 100);
  const color = percentColor(pct);
  const data = [{ value: pct, fill: color }];

  return (
    <div className="flex flex-col items-center" style={{ width: size, minWidth: size }}>
      <div style={{ width: size, height: size / 2 + 16, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="60%"
            outerRadius="100%"
            data={data}
            startAngle={180}
            endAngle={0}
            cx="50%"
            cy="100%"
          >
            <RadialBar
              dataKey="value"
              cornerRadius={4}
              background={{ fill: "#1f2937" }}
              isAnimationActive={false}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            bottom: 4,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <span className="text-white font-bold text-xl">{pct.toFixed(0)}%</span>
        </div>
      </div>
      {label && <span className="text-gray-400 text-xs mt-1">{label}</span>}
    </div>
  );
}
