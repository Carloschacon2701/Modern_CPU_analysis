export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatBytesPerSec(bps: number): string {
  return `${formatBytes(bps)}/s`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function formatNumber(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}G`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function percentColor(percent: number): string {
  if (percent < 60) return "#22c55e";
  if (percent < 80) return "#f59e0b";
  return "#ef4444";
}

export function interpolateColor(percent: number): string {
  const colors = [
    { threshold: 60, color: "#22c55e" },
    { threshold: 80, color: "#eab308" },
    { threshold: 95, color: "#f97316" },
    { threshold: 101, color: "#ef4444" },
  ];
  for (const { threshold, color } of colors) {
    if (percent < threshold) return color;
  }
  return "#ef4444";
}
