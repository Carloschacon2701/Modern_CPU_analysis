"use client";

import { useTranslations } from "next-intl";
import { interpolateColor } from "@/lib/format-utils";
import type { CoreStat } from "@/lib/metrics-types";

interface HeatmapGridProps {
  cores: CoreStat[];
}

export function HeatmapGrid({ cores }: HeatmapGridProps) {
  const t = useTranslations("heatmap");

  if (!cores.length) return <div className="text-gray-500 text-xs">{t("noData")}</div>;

  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${Math.min(cores.length, 8)}, minmax(0, 1fr))` }}
    >
      {cores.map((core) => (
        <div
          key={core.core_id}
          className="rounded flex flex-col items-center justify-center text-xs font-medium text-white"
          style={{
            backgroundColor: interpolateColor(core.percent),
            height: 40,
            opacity: 0.85 + 0.15 * (core.percent / 100),
          }}
          title={t("tooltip", { id: core.core_id, pct: core.percent.toFixed(1) })}
        >
          <span className="text-[10px] opacity-70">{t("coreLabel", { id: core.core_id })}</span>
          <span>{core.percent.toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}
