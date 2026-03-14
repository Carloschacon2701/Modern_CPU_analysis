export const WS_URL = "ws://localhost:8000/ws/metrics";
export const API_BASE = "";
export const CHART_WINDOW = 60; // seconds of history shown in charts
export const COLLECTION_INTERVAL_MS = 1000;

export const COLORS = {
  cpu: "#6366f1",
  memory: "#22d3ee",
  disk: "#f59e0b",
  network: "#10b981",
  danger: "#ef4444",
  warning: "#f97316",
  success: "#22c55e",
  muted: "#64748b",
};

export const CORE_COLOR_SCALE = [
  "#22c55e",
  "#84cc16",
  "#eab308",
  "#f97316",
  "#ef4444",
];

export const WORKLOAD_LABELS: Record<string, string> = {
  cpu_prime: "CPU — Prime Sieve",
  cpu_fibonacci: "CPU — Fibonacci",
  cpu_sort: "CPU — Quicksort",
  memory_sequential: "Memory — Sequential",
  memory_random: "Memory — Random Access",
  parallel: "Parallel — Multi-thread",
  ai_matrix: "AI — Matrix Multiply",
  ai_kmeans: "AI — K-Means Clustering",
  ai_nn: "AI — Neural Network (XOR)",
};
