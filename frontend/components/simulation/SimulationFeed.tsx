"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useMetricsStore } from "@/hooks/useMetricsStore";
import type { SimulationEvent } from "@/lib/metrics-types";
import { clsx } from "clsx";

function eventColor(event: string): string {
  if (event === "started") return "text-green-400";
  if (event === "completed") return "text-blue-400";
  if (event === "error") return "text-red-400";
  return "text-gray-300";
}

function formatPayload(payload: Record<string, unknown>): string {
  return Object.entries(payload)
    .map(([k, v]) => `${k}=${typeof v === "number" ? (Number.isInteger(v) ? v : (v as number).toFixed(4)) : v}`)
    .join("  ");
}

export function SimulationFeed() {
  const t = useTranslations("simulation.feed");
  const events = useMetricsStore((s) => s.simulationEvents);
  const clearEvents = useMetricsStore((s) => s.clearSimulationEvents);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col" style={{ height: 400 }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
        <span className="text-gray-400 text-xs uppercase tracking-wide">{t("title")}</span>
        <button onClick={clearEvents} className="text-gray-500 hover:text-gray-300 text-xs">
          {t("clear")}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-0.5">
        {events.length === 0 ? (
          <p className="text-gray-600">{t("empty")}</p>
        ) : (
          events.map((evt, i) => <EventLine key={i} evt={evt} />)
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function EventLine({ evt }: { evt: SimulationEvent }) {
  const time = new Date(evt.timestamp).toLocaleTimeString();
  return (
    <div className="flex gap-2">
      <span className="text-gray-600 shrink-0">{time}</span>
      <span className="text-yellow-600 shrink-0">[{evt.workload}]</span>
      <span className={clsx("shrink-0 font-semibold", eventColor(evt.event))}>{evt.event}</span>
      <span className="text-gray-400">{formatPayload(evt.payload)}</span>
    </div>
  );
}
