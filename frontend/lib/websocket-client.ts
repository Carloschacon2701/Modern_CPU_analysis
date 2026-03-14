import { WS_URL } from "./constants";
import type { WsMessage } from "./metrics-types";

type Listener = (msg: WsMessage) => void;
type StatusListener = (status: ConnectionStatus) => void;

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "failed";

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;
const RECONNECT_MAX_ATTEMPTS = 10;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();
  private retryCount = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldConnect = false;
  private _status: ConnectionStatus = "connecting";

  get status(): ConnectionStatus {
    return this._status;
  }

  private setStatus(s: ConnectionStatus) {
    this._status = s;
    this.statusListeners.forEach((l) => l(s));
  }

  connect() {
    if (typeof window === "undefined") return;
    this.shouldConnect = true;
    this._connect();
  }

  disconnect() {
    this.shouldConnect = false;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.ws?.close();
    this.ws = null;
  }

  private _connect() {
    if (!this.shouldConnect) return;
    this.setStatus(this.retryCount === 0 ? "connecting" : "reconnecting");

    try {
      this.ws = new WebSocket(WS_URL);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.retryCount = 0;
      this.setStatus("connected");
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage;
        this.listeners.forEach((l) => l(msg));
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      if (this.shouldConnect) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect() {
    if (this.retryCount >= RECONNECT_MAX_ATTEMPTS) {
      this.setStatus("failed");
      return;
    }
    const delay = Math.min(
      RECONNECT_BASE_MS * Math.pow(2, this.retryCount),
      RECONNECT_MAX_MS
    );
    this.retryCount++;
    this.retryTimer = setTimeout(() => this._connect(), delay);
  }

  forceReconnect() {
    this.retryCount = 0;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.ws?.close();
    this._connect();
  }

  onMessage(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStatus(listener: StatusListener) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }
}

// Singleton
export const wsClient = new WebSocketClient();
