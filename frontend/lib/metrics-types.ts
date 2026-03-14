export interface CoreStat {
  core_id: number;
  percent: number;
}

export interface CpuSnapshot {
  percent_total: number;
  percent_per_core: CoreStat[];
  frequency_mhz: number;
  frequency_min_mhz: number;
  frequency_max_mhz: number;
  user_time: number;
  system_time: number;
  idle_time: number;
  iowait_time: number;
  estimated_instructions: number;
  execution_time_s: number;
  context_switches: number;
}

export interface MemorySnapshot {
  total_bytes: number;
  available_bytes: number;
  used_bytes: number;
  percent: number;
  buffers_bytes: number;
  cached_bytes: number;
  swap_total_bytes: number;
  swap_used_bytes: number;
  swap_percent: number;
  read_ops_per_sec: number;
  write_ops_per_sec: number;
  simulated_latency_ns: number;
}

export interface DiskIoStat {
  read_bytes_per_sec: number;
  write_bytes_per_sec: number;
  read_ops_per_sec: number;
  write_ops_per_sec: number;
}

export interface NetIoStat {
  bytes_sent_per_sec: number;
  bytes_recv_per_sec: number;
  packets_sent_per_sec: number;
  packets_recv_per_sec: number;
}

export interface SimulatedDevice {
  name: string;
  ops_per_sec: number;
  throughput_bytes_per_sec: number;
  latency_ms: number;
  active: boolean;
}

export interface IoSnapshot {
  disk: DiskIoStat;
  network: NetIoStat;
  simulated_devices: SimulatedDevice[];
}

export interface ThreadInfo {
  thread_id: number;
  user_time: number;
  system_time: number;
}

export interface ProcessEntry {
  pid: number;
  name: string;
  status: string;
  cpu_percent: number;
  memory_percent: number;
  num_threads: number;
  priority: number;
  threads: ThreadInfo[];
}

export interface MetricsSnapshot {
  type: "metrics";
  timestamp: string;
  cpu: CpuSnapshot;
  memory: MemorySnapshot;
  io: IoSnapshot;
  processes: ProcessEntry[];
}

export interface SimulationEvent {
  type: "simulation_event";
  run_id: string;
  workload: string;
  event: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export type WsMessage = MetricsSnapshot | SimulationEvent;
