"use client";

import { useEffect, useState } from "react";
import { wsClient, type ConnectionStatus } from "@/lib/websocket-client";
import type { MetricsSnapshot, SimulationEvent } from "@/lib/metrics-types";
import { useMetricsStore } from "./useMetricsStore";

export function useWebSocket() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const pushSnapshot = useMetricsStore((s) => s.pushSnapshot);
  const pushSimulationEvent = useMetricsStore((s) => s.pushSimulationEvent);

  useEffect(() => {
    wsClient.connect();

    const unsubStatus = wsClient.onStatus(setStatus);
    const unsubMsg = wsClient.onMessage((msg) => {
      if (msg.type === "metrics") {
        pushSnapshot(msg as MetricsSnapshot);
      } else if (msg.type === "simulation_event") {
        pushSimulationEvent(msg as SimulationEvent);
      }
    });

    return () => {
      unsubStatus();
      unsubMsg();
    };
  }, [pushSnapshot, pushSimulationEvent]);

  return { status, reconnect: () => wsClient.forceReconnect() };
}
