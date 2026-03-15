"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Play, Square } from "lucide-react";
import { HardwareProfileSelector } from "./HardwareProfileSelector";

interface SimulationControlsProps {
  onStart: (workload: string, intensity: number, duration: number, profile: string) => void;
  onStop: (runId: string) => void;
  activeRunId: string | null;
  isRunning: boolean;
}

export function SimulationControls({
  onStart,
  onStop,
  activeRunId,
  isRunning,
}: SimulationControlsProps) {
  const t = useTranslations("simulation");
  const [workload, setWorkload] = useState("ai_matrix");
  const [intensity, setIntensity] = useState(5);
  const [duration, setDuration] = useState(30);
  const [profile, setProfile] = useState("real_machine");

  const workloadKeys = [
    "cpu_prime", "cpu_fibonacci", "cpu_sort",
    "memory_sequential", "memory_random",
    "parallel",
    "ai_matrix", "ai_kmeans", "ai_nn",
  ] as const;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
      <h3 className="text-white font-semibold text-sm">{t("controls.title")}</h3>

      <HardwareProfileSelector
        value={profile}
        onChange={setProfile}
        disabled={isRunning}
      />

      <div>
        <label className="text-gray-400 text-xs uppercase tracking-wide">
          {t("controls.workloadType")}
        </label>
        <select
          value={workload}
          onChange={(e) => setWorkload(e.target.value)}
          disabled={isRunning}
          className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        >
          {workloadKeys.map((key) => (
            <option key={key} value={key}>
              {t(`workloads.${key}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-gray-400 text-xs uppercase tracking-wide">
          {t("controls.intensity")} <span className="text-white">{intensity}</span>
        </label>
        <input
          type="range" min={1} max={10} value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          disabled={isRunning}
          className="mt-1 w-full accent-indigo-500 disabled:opacity-50"
        />
        <div className="flex justify-between text-gray-600 text-xs">
          <span>{t("controls.low")}</span>
          <span>{t("controls.high")}</span>
        </div>
      </div>

      <div>
        <label className="text-gray-400 text-xs uppercase tracking-wide">
          {t("controls.duration")} <span className="text-white">{duration}{t("controls.seconds")}</span>
        </label>
        <input
          type="range" min={5} max={120} step={5} value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          disabled={isRunning}
          className="mt-1 w-full accent-indigo-500 disabled:opacity-50"
        />
        <div className="flex justify-between text-gray-600 text-xs">
          <span>5s</span>
          <span>120s</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onStart(workload, intensity, duration, profile)}
          disabled={isRunning}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Play size={14} />
          {isRunning ? t("controls.running") : t("controls.start")}
        </button>
        {isRunning && activeRunId && (
          <button
            onClick={() => onStop(activeRunId)}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <Square size={14} />
            {t("controls.stop")}
          </button>
        )}
      </div>
    </div>
  );
}
