"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { RefreshCw } from "lucide-react";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  module: string;
}

interface LogsResponse {
  count: number;
  entries: LogEntry[];
}

const LEVEL_COLORS: Record<string, string> = {
  DEBUG: "text-gray-500 bg-gray-800",
  INFO: "text-blue-400 bg-blue-900/30",
  WARNING: "text-yellow-400 bg-yellow-900/30",
  ERROR: "text-red-400 bg-red-900/30",
  CRITICAL: "text-red-300 bg-red-900/50",
};

export function LogViewer() {
  const t = useTranslations("logs");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState<string>("");
  const [limit, setLimit] = useState(200);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (level) params.set("level", level);
      const res = await fetch(`/api/logs?${params}`);
      if (res.ok) {
        const data: LogsResponse = await res.json();
        setLogs(data.entries);
      }
    } finally {
      setLoading(false);
    }
  }, [level, limit]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="">{t("allLevels")}</option>
          <option value="DEBUG">DEBUG</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
        </select>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value={50}>{t("limits.last50")}</option>
          <option value={100}>{t("limits.last100")}</option>
          <option value={200}>{t("limits.last200")}</option>
          <option value={500}>{t("limits.last500")}</option>
        </select>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-sm transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          {t("refresh")}
        </button>
        <span className="text-gray-500 text-xs ml-auto">
          {logs.length} {t("entries")}
        </span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-y-auto font-mono text-xs" style={{ maxHeight: 500 }}>
          {logs.length === 0 ? (
            <p className="text-gray-600 p-4">{t("empty")}</p>
          ) : (
            logs.map((entry, i) => (
              <div key={i} className="flex gap-3 px-3 py-1.5 border-b border-gray-800/50 hover:bg-gray-800/30">
                <span className="text-gray-600 shrink-0 w-20">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span className={clsx("shrink-0 px-1.5 rounded text-[10px] font-bold uppercase self-center", LEVEL_COLORS[entry.level] ?? "text-gray-400 bg-gray-800")}>
                  {entry.level}
                </span>
                <span className="text-indigo-400 shrink-0 w-32 truncate">{entry.module}</span>
                <span className="text-gray-300 break-all">{entry.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
