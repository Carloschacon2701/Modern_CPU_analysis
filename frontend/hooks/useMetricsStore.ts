"use client";

import { create } from "zustand";
import type {
  CpuSnapshot,
  IoSnapshot,
  MemorySnapshot,
  MetricsSnapshot,
  ProcessEntry,
  SimulationEvent,
} from "@/lib/metrics-types";
import { CHART_WINDOW } from "@/lib/constants";

interface TimedCpu extends CpuSnapshot { timestamp: string }
interface TimedMemory extends MemorySnapshot { timestamp: string }
interface TimedDisk { timestamp: string; read_bps: number; write_bps: number; read_ops: number; write_ops: number }
interface TimedNet { timestamp: string; sent_bps: number; recv_bps: number }

interface MetricsState {
  cpuHistory: TimedCpu[];
  memoryHistory: TimedMemory[];
  diskHistory: TimedDisk[];
  netHistory: TimedNet[];
  latestCpu: CpuSnapshot | null;
  latestMemory: MemorySnapshot | null;
  latestIo: IoSnapshot | null;
  processes: ProcessEntry[];
  simulationEvents: SimulationEvent[];
  lastTimestamp: string | null;

  pushSnapshot: (snap: MetricsSnapshot) => void;
  pushSimulationEvent: (evt: SimulationEvent) => void;
  clearSimulationEvents: () => void;
}

function windowedPush<T>(arr: T[], item: T, maxLen: number): T[] {
  const next = [...arr, item];
  return next.length > maxLen ? next.slice(next.length - maxLen) : next;
}

export const useMetricsStore = create<MetricsState>((set) => ({
  cpuHistory: [],
  memoryHistory: [],
  diskHistory: [],
  netHistory: [],
  latestCpu: null,
  latestMemory: null,
  latestIo: null,
  processes: [],
  simulationEvents: [],
  lastTimestamp: null,

  pushSnapshot: (snap) =>
    set((s) => ({
      latestCpu: snap.cpu,
      latestMemory: snap.memory,
      latestIo: snap.io,
      processes: snap.processes,
      lastTimestamp: snap.timestamp,
      cpuHistory: windowedPush(s.cpuHistory, { ...snap.cpu, timestamp: snap.timestamp }, CHART_WINDOW),
      memoryHistory: windowedPush(s.memoryHistory, { ...snap.memory, timestamp: snap.timestamp }, CHART_WINDOW),
      diskHistory: windowedPush(
        s.diskHistory,
        {
          timestamp: snap.timestamp,
          read_bps: snap.io.disk.read_bytes_per_sec,
          write_bps: snap.io.disk.write_bytes_per_sec,
          read_ops: snap.io.disk.read_ops_per_sec,
          write_ops: snap.io.disk.write_ops_per_sec,
        },
        CHART_WINDOW
      ),
      netHistory: windowedPush(
        s.netHistory,
        {
          timestamp: snap.timestamp,
          sent_bps: snap.io.network.bytes_sent_per_sec,
          recv_bps: snap.io.network.bytes_recv_per_sec,
        },
        CHART_WINDOW
      ),
    })),

  pushSimulationEvent: (evt) =>
    set((s) => ({
      simulationEvents: [...s.simulationEvents.slice(-200), evt],
    })),

  clearSimulationEvents: () => set({ simulationEvents: [] }),
}));
