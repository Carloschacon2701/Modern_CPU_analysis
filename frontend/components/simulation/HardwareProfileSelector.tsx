"use client";

import { useTranslations } from "next-intl";
import { Cpu } from "lucide-react";

export interface ProfileSpec {
  id: string;
  cpu_cores: number;
  cpu_freq_mhz: number;
  cpu_freq_max_mhz: number;
  memory_total_mb: number;
  cpu_factor: number;
  memory_latency_multiplier: number;
}

const PROFILE_IDS = [
  "real_machine",
  "raspberry_pi4",
  "old_laptop_2012",
  "cloud_t3micro",
  "server_xeon",
  "gaming_desktop_i9",
] as const;

function factorBadge(factor: number): { label: string; color: string } {
  if (factor === 1.0) return { label: "1×", color: "text-gray-400" };
  if (factor < 1.0) return { label: `${factor}×`, color: "text-amber-400" };
  return { label: `${factor}×`, color: "text-emerald-400" };
}

interface Props {
  value: string;
  onChange: (profileId: string) => void;
  disabled?: boolean;
}

export function HardwareProfileSelector({ value, onChange, disabled }: Props) {
  const t = useTranslations("simulation");

  const selected = value;
  const { label: speedLabel, color: speedColor } = factorBadge(
    selected === "real_machine" ? 1.0
    : selected === "raspberry_pi4" ? 0.15
    : selected === "old_laptop_2012" ? 0.28
    : selected === "cloud_t3micro" ? 0.42
    : selected === "server_xeon" ? 1.80
    : selected === "gaming_desktop_i9" ? 2.50
    : 1.0
  );

  return (
    <div>
      <label className="text-gray-400 text-xs uppercase tracking-wide flex items-center gap-1.5">
        <Cpu size={11} />
        {t("controls.hardwareProfile")}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
      >
        {PROFILE_IDS.map((id) => (
          <option key={id} value={id}>
            {t(`profiles.${id}.name`)}
          </option>
        ))}
      </select>

      {/* Info card for selected profile */}
      <div className="mt-2 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-xs space-y-0.5">
        <p className="text-gray-300">{t(`profiles.${value}.description`)}</p>
        <p className={`font-semibold ${speedColor}`}>
          {value === "real_machine"
            ? t("profileSpecs.realMachine")
            : t("profileSpecs.factor", { x: speedLabel })}
        </p>
      </div>
    </div>
  );
}
