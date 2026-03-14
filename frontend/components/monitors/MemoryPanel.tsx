"use client";

import { useTranslations } from "next-intl";
import { useMetricsStore } from "@/hooks/useMetricsStore";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { COLORS } from "@/lib/constants";
import { formatBytes, formatNumber } from "@/lib/format-utils";

export function MemoryPanel() {
  const t = useTranslations("memory");
  const tc = useTranslations("common");
  const mem = useMetricsStore((s) => s.latestMemory);
  const history = useMetricsStore((s) => s.memoryHistory);

  if (!mem) return <div className="text-gray-500 text-sm p-4">{tc("waitingForData")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-6 items-start">
        <GaugeChart value={mem.percent} label={t("gauge")} size={140} />
        <div className="grid grid-cols-2 gap-3 flex-1 min-w-48">
          <Stat label={t("stats.totalRam")} value={formatBytes(mem.total_bytes)} />
          <Stat label={t("stats.available")} value={formatBytes(mem.available_bytes)} />
          <Stat label={t("stats.used")} value={formatBytes(mem.used_bytes)} />
          <Stat label={t("stats.cached")} value={formatBytes(mem.cached_bytes)} />
          <Stat
            label={t("stats.swapUsed")}
            value={formatBytes(mem.swap_used_bytes)}
            sub={t("stats.swapOf", {
              pct: mem.swap_percent.toFixed(1),
              total: formatBytes(mem.swap_total_bytes),
            })}
          />
          <Stat
            label={t("stats.simLatency")}
            value={`${mem.simulated_latency_ns.toFixed(0)} ns`}
            sub={t("stats.dramPressure")}
          />
        </div>
      </div>

      <div>
        <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">
          {t("charts.usageHistory")}
        </h3>
        <TimeSeriesChart
          data={history}
          series={[{ dataKey: "percent", color: COLORS.memory, name: t("charts.ramPercent") }]}
          domain={[0, 100]}
          unit="%"
        />
      </div>

      <div>
        <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">
          {t("charts.opsTitle")}
        </h3>
        <TimeSeriesChart
          data={history}
          series={[
            { dataKey: "read_ops_per_sec", color: "#22d3ee", name: t("charts.reads") },
            { dataKey: "write_ops_per_sec", color: "#f59e0b", name: t("charts.writes") },
          ]}
          domain={[0, "auto"]}
          unit=" ops"
          height={160}
          formatter={(v) => `${formatNumber(v)} ops`}
        />
      </div>

      <div>
        <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">
          {t("charts.latencyTitle")}
        </h3>
        <TimeSeriesChart
          data={history}
          series={[{ dataKey: "simulated_latency_ns", color: "#a78bfa", name: t("charts.latency") }]}
          domain={[0, 500]}
          unit=" ns"
          height={120}
        />
      </div>

      <p className="text-gray-600 text-xs">{t("footnote")}</p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-800 rounded-lg px-3 py-2">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-white text-sm font-semibold mt-0.5">{value}</p>
      {sub && <p className="text-gray-600 text-xs">{sub}</p>}
    </div>
  );
}
