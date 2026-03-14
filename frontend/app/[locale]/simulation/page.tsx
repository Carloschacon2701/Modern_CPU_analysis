"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SimulationControls } from "@/components/simulation/SimulationControls";
import { SimulationFeed } from "@/components/simulation/SimulationFeed";
import { WorkloadImpactChart } from "@/components/simulation/WorkloadImpactChart";
import { useMetricsStore } from "@/hooks/useMetricsStore";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { COLORS } from "@/lib/constants";

export default function SimulationPage() {
  const t = useTranslations("simulation");
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeWorkload, setActiveWorkload] = useState<string>("ai_matrix");
  const [isRunning, setIsRunning] = useState(false);

  const cpu = useMetricsStore((s) => s.latestCpu);
  const mem = useMetricsStore((s) => s.latestMemory);
  const cpuHistory = useMetricsStore((s) => s.cpuHistory);
  const memHistory = useMetricsStore((s) => s.memoryHistory);

  const handleStart = async (workload: string, intensity: number, duration: number) => {
    try {
      const res = await fetch("/api/simulation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workload_type: workload, intensity, duration_seconds: duration }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRunId(data.run_id);
        setActiveWorkload(workload);
        setIsRunning(true);
        setTimeout(() => setIsRunning(false), duration * 1000 + 2000);
      }
    } catch (e) {
      console.error("Failed to start simulation", e);
    }
  };

  const handleStop = async (runId: string) => {
    try {
      await fetch(`/api/simulation/stop/${runId}`, { method: "POST" });
      setIsRunning(false);
    } catch (e) {
      console.error("Failed to stop simulation", e);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-white text-2xl font-bold">{t("title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("description")}</p>
      </div>

      {/* Controls + live feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <SimulationControls
            onStart={handleStart}
            onStop={handleStop}
            activeRunId={activeRunId}
            isRunning={isRunning}
          />

          {/* Live gauges */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3">
              {t("liveImpact")}
            </h3>
            <div className="flex justify-around">
              <GaugeChart value={cpu?.percent_total ?? 0} label="CPU" size={100} />
              <GaugeChart value={mem?.percent ?? 0} label="RAM" size={100} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <SimulationFeed />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">
                {t("cpuChart")}
              </h3>
              <TimeSeriesChart
                data={cpuHistory}
                series={[{ dataKey: "percent_total", color: COLORS.cpu, name: "CPU %" }]}
                domain={[0, 100]}
                unit="%"
                height={150}
              />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">
                {t("memoryChart")}
              </h3>
              <TimeSeriesChart
                data={memHistory}
                series={[{ dataKey: "percent", color: COLORS.memory, name: "RAM %" }]}
                domain={[0, 100]}
                unit="%"
                height={150}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Workload impact report — full width below */}
      <WorkloadImpactChart
        runId={activeRunId}
        workloadType={activeWorkload}
        isRunning={isRunning}
      />
    </div>
  );
}
