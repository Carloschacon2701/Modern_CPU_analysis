"use client";

import { useTranslations } from "next-intl";
import { useMetricsStore } from "@/hooks/useMetricsStore";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { HeatmapGrid } from "@/components/charts/HeatmapGrid";
import { COLORS } from "@/lib/constants";
import { formatNumber, formatDuration } from "@/lib/format-utils";

export function CpuPanel() {
  const t = useTranslations("cpu");
  const tc = useTranslations("common");
  const cpu = useMetricsStore((s) => s.latestCpu);
  const history = useMetricsStore((s) => s.cpuHistory);

  if (!cpu) return <div className="text-gray-500 text-sm p-4">{tc("waitingForData")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-6 items-start">
        <GaugeChart value={cpu.percent_total} label={t("gauge")} size={140} />
        <div className="grid grid-cols-2 gap-3 flex-1 min-w-48">
          <Stat label={t("stats.frequency")} value={`${cpu.frequency_mhz.toFixed(0)} MHz`} />
          <Stat label={t("stats.cores")} value={String(cpu.percent_per_core.length)} />
          <Stat label={t("stats.contextSwitches")} value={formatNumber(cpu.context_switches)} />
          <Stat label={t("stats.uptime")} value={formatDuration(cpu.execution_time_s)} />
          <Stat
            label={t("stats.estimatedInstructions")}
            value={formatNumber(cpu.estimated_instructions)}
            sub={t("stats.approxPerSec")}
          />
          <Stat
            label={t("stats.userSystem")}
            value={`${cpu.user_time.toFixed(0)}s / ${cpu.system_time.toFixed(0)}s`}
          />
        </div>
      </div>

      <div>
        <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">
          {t("charts.utilizationHistory")}
        </h3>
        <TimeSeriesChart
          data={history}
          series={[{ dataKey: "percent_total", color: COLORS.cpu, name: t("charts.cpuPercent") }]}
          domain={[0, 100]}
          unit="%"
        />
      </div>

      <div>
        <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">
          {t("charts.perCoreTitle")}
        </h3>
        <HeatmapGrid cores={cpu.percent_per_core} />
      </div>

      <div>
        <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">
          {t("charts.breakdownTitle")}
        </h3>
        <TimeSeriesChart
          data={history}
          series={[
            { dataKey: "user_time", color: "#6366f1", name: t("charts.user") },
            { dataKey: "system_time", color: "#f59e0b", name: t("charts.system") },
            { dataKey: "idle_time", color: "#374151", name: t("charts.idle") },
          ]}
          domain={[0, "auto"]}
          unit="s"
          height={160}
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
