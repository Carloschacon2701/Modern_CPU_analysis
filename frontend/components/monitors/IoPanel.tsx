"use client";

import { useTranslations } from "next-intl";
import { useMetricsStore } from "@/hooks/useMetricsStore";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { COLORS } from "@/lib/constants";
import { formatBytesPerSec } from "@/lib/format-utils";
import { clsx } from "clsx";

export function IoPanel() {
  const t = useTranslations("io");
  const io = useMetricsStore((s) => s.latestIo);
  const diskHistory = useMetricsStore((s) => s.diskHistory);
  const netHistory = useMetricsStore((s) => s.netHistory);

  if (!io) return <div className="text-gray-500 text-sm p-4">{t("waitingForData")}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("stats.diskRead")} value={formatBytesPerSec(io.disk.read_bytes_per_sec)} />
        <Stat label={t("stats.diskWrite")} value={formatBytesPerSec(io.disk.write_bytes_per_sec)} />
        <Stat label={t("stats.readOps")} value={io.disk.read_ops_per_sec.toFixed(1)} />
        <Stat label={t("stats.writeOps")} value={io.disk.write_ops_per_sec.toFixed(1)} />
      </div>

      <div>
        <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">
          {t("charts.diskTitle")}
        </h3>
        <TimeSeriesChart
          data={diskHistory}
          series={[
            { dataKey: "read_bps", color: COLORS.disk, name: t("charts.read") },
            { dataKey: "write_bps", color: "#ef4444", name: t("charts.write") },
          ]}
          domain={[0, "auto"]}
          height={180}
          formatter={(v) => formatBytesPerSec(v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("stats.netSent")} value={formatBytesPerSec(io.network.bytes_sent_per_sec)} />
        <Stat label={t("stats.netRecv")} value={formatBytesPerSec(io.network.bytes_recv_per_sec)} />
        <Stat label={t("stats.pktsSent")} value={io.network.packets_sent_per_sec.toFixed(1)} />
        <Stat label={t("stats.pktsRecv")} value={io.network.packets_recv_per_sec.toFixed(1)} />
      </div>

      <div>
        <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">
          {t("charts.netTitle")}
        </h3>
        <TimeSeriesChart
          data={netHistory}
          series={[
            { dataKey: "sent_bps", color: COLORS.network, name: t("charts.sent") },
            { dataKey: "recv_bps", color: "#6366f1", name: t("charts.recv") },
          ]}
          domain={[0, "auto"]}
          height={160}
          formatter={(v) => formatBytesPerSec(v)}
        />
      </div>

      <div>
        <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3">
          {t("devices.title")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {io.simulated_devices.map((dev) => (
            <div key={dev.name} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">{dev.name}</span>
                <span
                  className={clsx(
                    "text-xs px-1.5 py-0.5 rounded",
                    dev.active
                      ? "bg-green-900 text-green-400"
                      : "bg-gray-700 text-gray-500"
                  )}
                >
                  {dev.active ? t("devices.active") : t("devices.idle")}
                </span>
              </div>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>{t("devices.opsPerSec")}</span>
                  <span className="text-white">{dev.ops_per_sec.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("devices.throughput")}</span>
                  <span className="text-white">{formatBytesPerSec(dev.throughput_bytes_per_sec)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("devices.latency")}</span>
                  <span className="text-white">{dev.latency_ms} ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-lg px-3 py-2">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-white text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}
