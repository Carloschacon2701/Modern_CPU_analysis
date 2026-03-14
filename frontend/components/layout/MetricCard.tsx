import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  trend?: "up" | "down" | "stable";
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "#6366f1",
}: MetricCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}22`, color }}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-xs uppercase tracking-wide truncate">{title}</p>
        <p className="text-white text-2xl font-bold leading-tight mt-0.5">{value}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}
