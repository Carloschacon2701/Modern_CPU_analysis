"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatBytesPerSec, formatPercent } from "@/lib/format-utils";
import { WORKLOAD_LABELS } from "@/lib/constants";

interface ImpactSample {
  elapsed_s: number;
  cpu_percent: number;
  memory_percent: number;
  disk_read_bps: number;
  disk_write_bps: number;
  net_sent_bps: number;
  net_recv_bps: number;
  total_thread_count: number;
}

interface ImpactResponse {
  run_id: string;
  workload_type: string;
  status: string;
  sample_count: number;
  interval_s: number;
  samples: ImpactSample[];
}

interface WorkloadImpactChartProps {
  runId: string | null;
  workloadType: string;
  isRunning: boolean;
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-800 rounded-lg px-3 py-2 text-center">
      <p className="text-xs font-semibold" style={{ color }}>{label}</p>
      <p className="text-white text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}

const TOOLTIP_STYLE = {
  contentStyle: { background: "#111827", border: "1px solid #374151", borderRadius: 8 },
  labelStyle: { color: "#9ca3af", fontSize: 11 },
  itemStyle: { color: "#e5e7eb", fontSize: 12 },
};

export function WorkloadImpactChart({ runId, workloadType, isRunning }: WorkloadImpactChartProps) {
  const t = useTranslations("simulation.impact");
  const [data, setData] = useState<ImpactResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!runId) return;

    const fetchImpact = async () => {
      try {
        const res = await fetch(`/api/simulation/impact/${runId}`);
        if (res.ok) {
          const json: ImpactResponse = await res.json();
          setData(json);
        }
      } catch {
        // backend not ready yet
      }
    };

    setLoading(true);
    fetchImpact().finally(() => setLoading(false));

    // Poll while running, stop once completed
    if (isRunning) {
      const interval = setInterval(fetchImpact, 1500);
      return () => clearInterval(interval);
    }
  }, [runId, isRunning]);

  // Reset when a new run starts
  useEffect(() => {
    if (isRunning) setData(null);
  }, [isRunning]);

  if (!runId && !data) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-500 text-sm">{t("noData")}</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-400 text-sm animate-pulse">{t("loading")}</p>
      </div>
    );
  }

  if (!data || data.samples.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-500 text-sm animate-pulse">{t("loading")}</p>
      </div>
    );
  }

  const samples = data.samples;
  const duration = samples.length > 0 ? samples[samples.length - 1].elapsed_s : 0;

  const cpuValues = samples.map((s) => s.cpu_percent);
  const memValues = samples.map((s) => s.memory_percent);
  const peakCpu = Math.max(...cpuValues);
  const peakMem = Math.max(...memValues);
  const avgCpuVal = avg(cpuValues);
  const avgMemVal = avg(memValues);

  const label = WORKLOAD_LABELS[data.workload_type] ?? data.workload_type;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-white font-semibold text-sm">{t("title")}</h3>
          <p className="text-gray-500 text-xs mt-0.5">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded">
            {label}
          </span>
          <span className="text-xs text-gray-500">
            {t("samples", { count: samples.length, duration: duration.toFixed(1) })}
          </span>
          {isRunning && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Summary pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill label={t("peakCpu")} value={formatPercent(peakCpu)} color="#6366f1" />
          <StatPill label={t("peakMem")} value={formatPercent(peakMem)} color="#22d3ee" />
          <StatPill label={t("avgCpu")} value={formatPercent(avgCpuVal)} color="#a78bfa" />
          <StatPill label={t("avgMem")} value={formatPercent(avgMemVal)} color="#67e8f9" />
        </div>

        {/* CPU + Memory */}
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">{t("cpuTitle")}</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={samples} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="elapsed_s"
                tick={{ fill: "#6b7280", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}s`}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                width={38}
              />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
              <Line type="monotone" dataKey="cpu_percent" stroke="#6366f1" dot={false} strokeWidth={2} name={t("cpu")} isAnimationActive={false} />
              <Line type="monotone" dataKey="memory_percent" stroke="#22d3ee" dot={false} strokeWidth={2} name={t("memory")} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Disk I/O */}
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">{t("ioTitle")}</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={samples} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="elapsed_s" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}s`} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatBytesPerSec(v)} width={64} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => formatBytesPerSec(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
              <Line type="monotone" dataKey="disk_read_bps" stroke="#f59e0b" dot={false} strokeWidth={2} name={t("diskRead")} isAnimationActive={false} />
              <Line type="monotone" dataKey="disk_write_bps" stroke="#ef4444" dot={false} strokeWidth={2} name={t("diskWrite")} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Threads + Net side-by-side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">{t("threadTitle")}</p>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={samples} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="elapsed_s" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}s`} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} axisLine={false} width={38} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => Number(v).toFixed(0)} />
                <Line type="monotone" dataKey="total_thread_count" stroke="#10b981" dot={false} strokeWidth={2} name={t("threads")} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">{t("netTitle")}</p>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={samples} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="elapsed_s" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}s`} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatBytesPerSec(v)} width={64} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => formatBytesPerSec(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
                <Line type="monotone" dataKey="net_sent_bps" stroke="#10b981" dot={false} strokeWidth={2} name={t("netSent")} isAnimationActive={false} />
                <Line type="monotone" dataKey="net_recv_bps" stroke="#6366f1" dot={false} strokeWidth={2} name={t("netRecv")} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
