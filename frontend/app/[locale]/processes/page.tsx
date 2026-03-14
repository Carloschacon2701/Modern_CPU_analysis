"use client";

import { useTranslations } from "next-intl";
import { ProcessTable } from "@/components/monitors/ProcessTable";
import { useMetricsStore } from "@/hooks/useMetricsStore";

export default function ProcessesPage() {
  const t = useTranslations("processes");
  const procs = useMetricsStore((s) => s.processes);

  const running = procs.filter((p) => p.status === "running").length;
  const sleeping = procs.filter((p) => p.status === "sleeping").length;
  const totalThreads = procs.reduce((acc, p) => acc + p.num_threads, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-white text-2xl font-bold">{t("title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("description")}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wide">{t("stats.totalShown")}</p>
          <p className="text-white text-2xl font-bold mt-1">{procs.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wide">{t("stats.runningSlashSleeping")}</p>
          <p className="text-white text-2xl font-bold mt-1">
            <span className="text-green-400">{running}</span>
            <span className="text-gray-600"> / </span>
            <span className="text-yellow-400">{sleeping}</span>
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wide">{t("stats.totalThreads")}</p>
          <p className="text-white text-2xl font-bold mt-1">{totalThreads}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <ProcessTable />
      </div>
    </div>
  );
}
