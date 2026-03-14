"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMetricsStore } from "@/hooks/useMetricsStore";
import type { ProcessEntry } from "@/lib/metrics-types";
import { clsx } from "clsx";
import { ChevronUp, ChevronDown } from "lucide-react";

type SortKey = "cpu_percent" | "memory_percent" | "num_threads" | "priority" | "pid" | "name";

export function ProcessTable() {
  const t = useTranslations("processes");
  const processes = useMetricsStore((s) => s.processes);
  const [sortKey, setSortKey] = useState<SortKey>("cpu_percent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<number | null>(null);

  const sorted = [...processes].sort((a, b) => {
    const av = a[sortKey] as number | string;
    const bv = b[sortKey] as number | string;
    if (typeof av === "string")
      return sortDir === "asc"
        ? av.localeCompare(bv as string)
        : (bv as string).localeCompare(av);
    return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const Col = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide cursor-pointer hover:text-white select-none"
      onClick={() => handleSort(k)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === k ? (sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />) : null}
      </span>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <Col k="pid" label={t("table.pid")} />
            <Col k="name" label={t("table.name")} />
            <Col k="cpu_percent" label={t("table.cpuPercent")} />
            <Col k="memory_percent" label={t("table.memPercent")} />
            <Col k="num_threads" label={t("table.threads")} />
            <Col k="priority" label={t("table.priority")} />
            <th className="px-3 py-2 text-xs text-gray-400 uppercase">{t("table.status")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((proc) => (
            <>
              <tr
                key={proc.pid}
                className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer"
                onClick={() => setExpanded(expanded === proc.pid ? null : proc.pid)}
              >
                <td className="px-3 py-2 text-gray-400 font-mono text-xs">{proc.pid}</td>
                <td className="px-3 py-2 text-white font-medium max-w-36 truncate">{proc.name}</td>
                <td className="px-3 py-2"><CpuBar value={proc.cpu_percent} /></td>
                <td className="px-3 py-2 text-gray-300">{proc.memory_percent.toFixed(2)}%</td>
                <td className="px-3 py-2 text-gray-300">{proc.num_threads}</td>
                <td className="px-3 py-2 text-gray-300">{proc.priority}</td>
                <td className="px-3 py-2"><StatusBadge status={proc.status} t={t} /></td>
              </tr>
              {expanded === proc.pid && proc.threads.length > 0 && (
                <tr key={`${proc.pid}-threads`} className="bg-gray-800/30">
                  <td colSpan={7} className="px-6 py-2">
                    <p className="text-gray-400 text-xs mb-1">{t("table.threadsLabel")}</p>
                    <div className="flex flex-wrap gap-2">
                      {proc.threads.map((th) => (
                        <span key={th.thread_id} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                          {t("table.tid")} {th.thread_id} · {t("table.usr")} {th.user_time.toFixed(2)}s · {t("table.sys")} {th.system_time.toFixed(2)}s
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
      {processes.length === 0 && (
        <div className="text-gray-500 text-sm text-center py-8">{t("empty")}</div>
      )}
    </div>
  );
}

function CpuBar({ value }: { value: number }) {
  const color = value > 50 ? "#ef4444" : value > 20 ? "#f59e0b" : "#22c55e";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-gray-700 rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-gray-300 text-xs w-10">{value.toFixed(1)}%</span>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  return (
    <span className={clsx("text-xs px-1.5 py-0.5 rounded", {
      "bg-green-900 text-green-400": status === "running",
      "bg-yellow-900 text-yellow-400": status === "sleeping",
      "bg-gray-700 text-gray-400": !["running", "sleeping"].includes(status),
    })}>
      {status === "running" ? t("status.running") : status === "sleeping" ? t("status.sleeping") : status}
    </span>
  );
}
