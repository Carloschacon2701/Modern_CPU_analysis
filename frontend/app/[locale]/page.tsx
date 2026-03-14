"use client";

import { useTranslations } from "next-intl";
import { useMetricsStore } from "@/hooks/useMetricsStore";
import { MetricCard } from "@/components/layout/MetricCard";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { Cpu, MemoryStick, HardDrive, Activity } from "lucide-react";
import { COLORS } from "@/lib/constants";
import { formatBytes, formatBytesPerSec, formatPercent } from "@/lib/format-utils";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const cpu = useMetricsStore((s) => s.latestCpu);
  const mem = useMetricsStore((s) => s.latestMemory);
  const io = useMetricsStore((s) => s.latestIo);
  const procs = useMetricsStore((s) => s.processes);
  const cpuHistory = useMetricsStore((s) => s.cpuHistory);
  const memHistory = useMetricsStore((s) => s.memoryHistory);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">{t("title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("description")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t("cards.cpuUsage")}
          value={cpu ? formatPercent(cpu.percent_total) : "—"}
          subtitle={cpu ? `${cpu.frequency_mhz.toFixed(0)} MHz · ${cpu.percent_per_core.length} ${tc("cores")}` : ""}
          icon={Cpu}
          color={COLORS.cpu}
        />
        <MetricCard
          title={t("cards.memory")}
          value={mem ? formatPercent(mem.percent) : "—"}
          subtitle={mem ? `${formatBytes(mem.used_bytes)} / ${formatBytes(mem.total_bytes)}` : ""}
          icon={MemoryStick}
          color={COLORS.memory}
        />
        <MetricCard
          title={t("cards.diskIo")}
          value={io ? formatBytesPerSec(io.disk.read_bytes_per_sec + io.disk.write_bytes_per_sec) : "—"}
          subtitle={io ? t("diskSubtitle", { read: formatBytesPerSec(io.disk.read_bytes_per_sec), write: formatBytesPerSec(io.disk.write_bytes_per_sec) }) : ""}
          icon={HardDrive}
          color={COLORS.disk}
        />
        <MetricCard
          title={t("cards.processes")}
          value={procs.length ? String(procs.length) : "—"}
          subtitle={procs.length ? t("procsSubtitle", { count: procs.filter((p) => p.status === "running").length }) : ""}
          icon={Activity}
          color={COLORS.network}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-center">
          <GaugeChart value={cpu?.percent_total ?? 0} label="CPU" size={130} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-center">
          <GaugeChart value={mem?.percent ?? 0} label="RAM" size={130} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-center">
          <GaugeChart value={mem?.swap_percent ?? 0} label="Swap" size={130} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-center">
          <GaugeChart
            value={io ? Math.min(100, (io.disk.read_bytes_per_sec + io.disk.write_bytes_per_sec) / 1e8 * 100) : 0}
            label="Disk"
            size={130}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3">
            {t("charts.cpuHistory")}
          </h3>
          <TimeSeriesChart
            data={cpuHistory}
            series={[{ dataKey: "percent_total", color: COLORS.cpu, name: "CPU %" }]}
            domain={[0, 100]}
            unit="%"
          />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3">
            {t("charts.memoryHistory")}
          </h3>
          <TimeSeriesChart
            data={memHistory}
            series={[{ dataKey: "percent", color: COLORS.memory, name: "RAM %" }]}
            domain={[0, 100]}
            unit="%"
          />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3">
          {t("topProcesses")}
        </h3>
        <div className="space-y-1">
          {procs.slice(0, 5).map((p) => (
            <div key={p.pid} className="flex items-center gap-3 text-sm">
              <span className="text-gray-500 font-mono text-xs w-12">{p.pid}</span>
              <span className="text-white flex-1 truncate">{p.name}</span>
              <span className="text-gray-400 text-xs w-16 text-right">{p.cpu_percent.toFixed(1)}% CPU</span>
              <div className="w-20 bg-gray-800 rounded-full h-1">
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: `${Math.min(p.cpu_percent, 100)}%`,
                    backgroundColor: p.cpu_percent > 50 ? "#ef4444" : "#6366f1",
                  }}
                />
              </div>
            </div>
          ))}
          {!procs.length && <p className="text-gray-600 text-xs">{tc("waitingForData")}</p>}
        </div>
      </div>
    </div>
  );
}
