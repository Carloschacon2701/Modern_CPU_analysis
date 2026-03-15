import { describe, it, expect, beforeEach } from "vitest";
import { useMetricsStore } from "@/hooks/useMetricsStore";
import type { MetricsSnapshot, SimulationEvent } from "@/lib/metrics-types";
import { CHART_WINDOW } from "@/lib/constants";

function makeSnapshot(overrides: Partial<MetricsSnapshot> = {}): MetricsSnapshot {
  return {
    type: "metrics",
    timestamp: "2026-03-15T00:00:00Z",
    cpu: {
      percent_total: 25.0,
      percent_per_core: [{ core_id: 0, percent: 25.0 }],
      frequency_mhz: 2400,
      frequency_min_mhz: 800,
      frequency_max_mhz: 4000,
      user_time: 100,
      system_time: 50,
      idle_time: 850,
      iowait_time: 0,
      estimated_instructions: 150_000_000,
      execution_time_s: 120,
      context_switches: 50,
    },
    memory: {
      total_bytes: 8 * 1024 ** 3,
      available_bytes: 4 * 1024 ** 3,
      used_bytes: 4 * 1024 ** 3,
      percent: 50,
      buffers_bytes: 0,
      cached_bytes: 0,
      swap_total_bytes: 0,
      swap_used_bytes: 0,
      swap_percent: 0,
      read_ops_per_sec: 100,
      write_ops_per_sec: 50,
      simulated_latency_ns: 80,
    },
    io: {
      disk: {
        read_bytes_per_sec: 1024,
        write_bytes_per_sec: 512,
        read_ops_per_sec: 10,
        write_ops_per_sec: 5,
      },
      network: {
        bytes_sent_per_sec: 100,
        bytes_recv_per_sec: 200,
        packets_sent_per_sec: 10,
        packets_recv_per_sec: 20,
      },
      simulated_devices: [],
    },
    processes: [],
    ...overrides,
  };
}

function makeSimulationEvent(overrides: Partial<SimulationEvent> = {}): SimulationEvent {
  return {
    type: "simulation_event",
    run_id: "run-1",
    workload: "cpu_prime",
    event: "started",
    payload: {},
    timestamp: "2026-03-15T00:00:00Z",
    ...overrides,
  };
}

const initialState = {
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
};

beforeEach(() => {
  // Merge reset (no replace flag) so store actions are preserved
  useMetricsStore.setState(initialState);
});

describe("initial state", () => {
  it("has empty histories", () => {
    const state = useMetricsStore.getState();
    expect(state.cpuHistory).toEqual([]);
    expect(state.memoryHistory).toEqual([]);
    expect(state.diskHistory).toEqual([]);
    expect(state.netHistory).toEqual([]);
  });

  it("has null latest snapshots", () => {
    const state = useMetricsStore.getState();
    expect(state.latestCpu).toBeNull();
    expect(state.latestMemory).toBeNull();
    expect(state.latestIo).toBeNull();
  });

  it("has empty processes and events", () => {
    const state = useMetricsStore.getState();
    expect(state.processes).toEqual([]);
    expect(state.simulationEvents).toEqual([]);
    expect(state.lastTimestamp).toBeNull();
  });
});

describe("pushSnapshot", () => {
  it("updates latestCpu, latestMemory, latestIo", () => {
    const snap = makeSnapshot();
    useMetricsStore.getState().pushSnapshot(snap);

    const state = useMetricsStore.getState();
    expect(state.latestCpu).toEqual(snap.cpu);
    expect(state.latestMemory).toEqual(snap.memory);
    expect(state.latestIo).toEqual(snap.io);
  });

  it("updates lastTimestamp", () => {
    const snap = makeSnapshot({ timestamp: "2026-03-15T12:00:00Z" });
    useMetricsStore.getState().pushSnapshot(snap);
    expect(useMetricsStore.getState().lastTimestamp).toBe("2026-03-15T12:00:00Z");
  });

  it("updates processes", () => {
    const snap = makeSnapshot({
      processes: [
        {
          pid: 1,
          name: "init",
          status: "running",
          cpu_percent: 0,
          memory_percent: 0.1,
          num_threads: 1,
          priority: 0,
          threads: [],
        },
      ],
    });
    useMetricsStore.getState().pushSnapshot(snap);
    expect(useMetricsStore.getState().processes).toHaveLength(1);
    expect(useMetricsStore.getState().processes[0].pid).toBe(1);
  });

  it("appends cpu and memory history entries", () => {
    useMetricsStore.getState().pushSnapshot(makeSnapshot({ timestamp: "T1" }));
    useMetricsStore.getState().pushSnapshot(makeSnapshot({ timestamp: "T2" }));

    const state = useMetricsStore.getState();
    expect(state.cpuHistory).toHaveLength(2);
    expect(state.memoryHistory).toHaveLength(2);
    expect(state.diskHistory).toHaveLength(2);
    expect(state.netHistory).toHaveLength(2);
  });

  it("maps io disk fields to diskHistory correctly", () => {
    const snap = makeSnapshot();
    useMetricsStore.getState().pushSnapshot(snap);

    const disk = useMetricsStore.getState().diskHistory[0];
    expect(disk.read_bps).toBe(1024);
    expect(disk.write_bps).toBe(512);
    expect(disk.read_ops).toBe(10);
    expect(disk.write_ops).toBe(5);
    expect(disk.timestamp).toBe(snap.timestamp);
  });

  it("maps io network fields to netHistory correctly", () => {
    const snap = makeSnapshot();
    useMetricsStore.getState().pushSnapshot(snap);

    const net = useMetricsStore.getState().netHistory[0];
    expect(net.sent_bps).toBe(100);
    expect(net.recv_bps).toBe(200);
  });

  it("caps cpuHistory at CHART_WINDOW size", () => {
    for (let i = 0; i < CHART_WINDOW + 10; i++) {
      useMetricsStore.getState().pushSnapshot(makeSnapshot({ timestamp: `T${i}` }));
    }
    expect(useMetricsStore.getState().cpuHistory).toHaveLength(CHART_WINDOW);
  });

  it("keeps only the most recent CHART_WINDOW entries", () => {
    for (let i = 0; i < CHART_WINDOW + 5; i++) {
      useMetricsStore.getState().pushSnapshot(makeSnapshot({ timestamp: `T${i}` }));
    }
    const history = useMetricsStore.getState().cpuHistory;
    // Most recent entry should be the last pushed
    expect(history[history.length - 1].timestamp).toBe(`T${CHART_WINDOW + 4}`);
  });
});

describe("pushSimulationEvent", () => {
  it("appends a simulation event", () => {
    const evt = makeSimulationEvent();
    useMetricsStore.getState().pushSimulationEvent(evt);
    expect(useMetricsStore.getState().simulationEvents).toHaveLength(1);
    expect(useMetricsStore.getState().simulationEvents[0]).toEqual(evt);
  });

  it("keeps up to 201 events (200 retained + new one)", () => {
    for (let i = 0; i < 205; i++) {
      useMetricsStore
        .getState()
        .pushSimulationEvent(makeSimulationEvent({ timestamp: `T${i}` }));
    }
    // slice(-200) keeps 200, then appends 1 = 201
    expect(useMetricsStore.getState().simulationEvents).toHaveLength(201);
  });

  it("retains the most recent events when capped", () => {
    for (let i = 0; i < 205; i++) {
      useMetricsStore
        .getState()
        .pushSimulationEvent(makeSimulationEvent({ timestamp: `T${i}` }));
    }
    const events = useMetricsStore.getState().simulationEvents;
    expect(events[events.length - 1].timestamp).toBe("T204");
  });
});

describe("clearSimulationEvents", () => {
  it("clears all simulation events", () => {
    useMetricsStore.getState().pushSimulationEvent(makeSimulationEvent());
    useMetricsStore.getState().pushSimulationEvent(makeSimulationEvent());
    useMetricsStore.getState().clearSimulationEvents();
    expect(useMetricsStore.getState().simulationEvents).toEqual([]);
  });

  it("is safe to call when already empty", () => {
    useMetricsStore.getState().clearSimulationEvents();
    expect(useMetricsStore.getState().simulationEvents).toEqual([]);
  });
});
