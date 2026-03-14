"use client";

import { useTranslations } from "next-intl";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useMetricsStore } from "@/hooks/useMetricsStore";
import { clsx } from "clsx";
import type { ConnectionStatus } from "@/lib/websocket-client";
import { LanguageSwitcher } from "./LanguageSwitcher";

function StatusDot({ status }: { status: ConnectionStatus }) {
  return (
    <span
      className={clsx("inline-block w-2 h-2 rounded-full mr-1.5", {
        "bg-green-400 animate-pulse": status === "connected",
        "bg-yellow-400 animate-pulse": status === "connecting" || status === "reconnecting",
        "bg-red-500": status === "failed",
      })}
    />
  );
}

export function TopBar() {
  const t = useTranslations("topbar");
  const { status, reconnect } = useWebSocket();
  const lastTimestamp = useMetricsStore((s) => s.lastTimestamp);

  const statusLabel: Record<ConnectionStatus, string> = {
    connected: t("status.connected"),
    connecting: t("status.connecting"),
    reconnecting: t("status.reconnecting"),
    failed: t("status.failed"),
  };

  return (
    <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
      <span className="text-gray-400 text-xs">
        {lastTimestamp
          ? `${t("lastUpdate")} ${new Date(lastTimestamp).toLocaleTimeString()}`
          : t("waiting")}
      </span>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <span className="flex items-center text-xs text-gray-400">
          <StatusDot status={status} />
          {statusLabel[status]}
        </span>
        {status === "failed" && (
          <button
            onClick={reconnect}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
          >
            {t("reconnect")}
          </button>
        )}
      </div>
    </header>
  );
}
