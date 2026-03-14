# Technologies Used — CPU Analyzer Platform

> This document explains every library, framework, and tool used in this platform.
> The same content is available interactively at `/technologies` in the running app.

---

## Backend

### Python 3.9 — Runtime

**What:** General-purpose high-level programming language used for the entire backend.

**Why:** Excellent ecosystem for system programming (`psutil`), scientific computing (`numpy`), and web APIs (`FastAPI`). Readable syntax speeds up development and makes the code defensible in technical reviews.

**How:** All backend modules, monitors, simulation workloads, and API routes are written in Python. The virtual environment at `backend/.venv/` isolates all dependencies.

---

### FastAPI 0.115 — Web Framework

**What:** Modern async Python web framework for building REST APIs and WebSocket endpoints.

**Why:** Native `async/await` support shares one event loop between WebSocket broadcasting and HTTP request handling — no extra threads or proxies needed. Auto-generates OpenAPI documentation at `/docs` and `/redoc`.

**How:** Defines all REST routes (`/api/metrics`, `/api/simulation`, `/api/logs`) and the WebSocket endpoint (`/ws/metrics`). Uses Pydantic models for automatic request/response validation. The `lifespan` context manager starts the background metrics collection task on startup.

---

### Uvicorn 0.30 — ASGI Server

**What:** Lightning-fast ASGI server that runs FastAPI in production and development.

**Why:** ASGI (Asynchronous Server Gateway Interface) is required to handle concurrent WebSocket connections alongside HTTP requests in the same process. Uvicorn uses `uvloop` and `httptools` for maximum throughput.

**How:** Launched via `uvicorn main:app --reload` for development. Handles HTTP/1.1 upgrades to WebSocket, graceful shutdown, and hot-reload when source files change.

---

### psutil 6.0 — System Metrics

**What:** Cross-platform library for retrieving process and system utilization information from the OS.

**Why:** Wraps OS-specific syscalls (`/proc` filesystem on Linux, `sysctl` on macOS) into a clean Python API. Works on macOS for development and Linux for production deployment without any code changes.

**How:** Used in all four monitor modules:
- `cpu_monitor.py` — `cpu_percent()`, `cpu_freq()`, `cpu_times()`, `cpu_stats()`
- `memory_monitor.py` — `virtual_memory()`, `swap_memory()`
- `io_monitor.py` — `disk_io_counters()`, `net_io_counters()`
- `process_monitor.py` — `process_iter()`, `Process.threads()`

---

### NumPy ≥1.24 — Scientific Computing

**What:** Fundamental package for numerical computing — N-dimensional arrays, linear algebra, random number generation.

**Why:** Enables the AI innovation workloads to run fast matrix operations without requiring heavy ML frameworks like PyTorch or TensorFlow. The matrix multiply benchmark uses NumPy's BLAS-optimized routines, producing measurable CPU and memory pressure observable on the dashboard.

**How:** Used exclusively in `simulation/ai_workload.py` for three algorithms:
1. **Matrix Multiply** — randomized `float32` matrix multiply `A @ B` on `size×size` arrays
2. **K-Means** — Lloyd's algorithm using `np.linalg.norm` for distance computation
3. **Neural Network** — single-layer perceptron with sigmoid activations and manual backpropagation, all as numpy array operations

---

### Pydantic 2.9 — Data Validation

**What:** Data validation and serialization library using Python type annotations.

**Why:** Guarantees that every `MetricsSnapshot` sent over WebSocket has valid types and correct ranges. The TypeScript interfaces in `lib/metrics-types.ts` mirror Pydantic models exactly — if the Python schema changes, TypeScript will catch the mismatch at compile time.

**How:** All metrics models (`MetricsSnapshot`, `CpuSnapshot`, `MemorySnapshot`, `IoSnapshot`, `ProcessEntry`, `SimulationEvent`) are Pydantic `BaseModel` subclasses. `model_dump()` serializes to dict for JSON broadcasting. `Field()` annotations add documentation visible in the OpenAPI `/docs` interface.

---

### WebSockets (RFC 6455) — Protocol

**What:** Full-duplex communication protocol over a single persistent TCP connection.

**Why:** Polling the REST endpoint every second would create unnecessary HTTP overhead (headers, TLS handshakes) and introduce latency. WebSocket push delivers metrics immediately when collected, enabling true real-time charts.

**How:**
- **Backend:** FastAPI `@app.websocket('/ws/metrics')` endpoint. `core/broadcaster.py` fans out JSON to all connected clients using `asyncio.gather(return_exceptions=True)` — stale sockets never crash the broadcast loop.
- **Frontend:** `lib/websocket-client.ts` singleton with exponential backoff reconnect (1s → 2s → 4s → ... → 30s cap, 10 max attempts).

---

## Frontend

### Next.js 14 — React Framework

**What:** React meta-framework with App Router, server components, file-based routing, and built-in optimizations.

**Why:** App Router provides locale-based routing (`[locale]` path segment) natively. `next-intl` integrates at the framework level. The `rewrites` in `next.config.ts` proxy `/api/*` to the Python backend, eliminating CORS issues in development with zero configuration on the backend side.

**How:** All pages live under `app/[locale]/` for i18n routing. The `[locale]/layout.tsx` provides `NextIntlClientProvider` to all client components. `next.config.ts` uses `createNextIntlPlugin` wrapper and defines the `/api` proxy rewrite.

---

### TypeScript 5 — Language

**What:** Typed superset of JavaScript that compiles to plain JavaScript.

**Why:** The `lib/metrics-types.ts` file mirrors the Python Pydantic models exactly. TypeScript catches mismatches between what the WebSocket sends and what components expect — critical when the backend schema evolves. The compiler also catches missing translation keys.

**How:** All `.ts` and `.tsx` files use strict TypeScript. Interface types in `lib/metrics-types.ts` define the WebSocket contract. Zustand store types ensure correct data shapes flow through all chart components with no runtime `any` coercions.

---

### Recharts 2 — Charting

**What:** Composable charting library built on React components and D3.

**Why:** React component model integrates with the render cycle naturally. Unlike Chart.js which requires imperative canvas manipulation via refs, Recharts re-renders when data changes following React's data-flow model. `isAnimationActive={false}` on `Line` components is critical for smooth 1 Hz updates.

**How:**
- `TimeSeriesChart` wraps `LineChart` with a sliding 60-point window and configurable series
- `GaugeChart` uses `RadialBarChart` in half-circle mode with color interpolation (green→yellow→red)
- `HeatmapGrid` renders a CSS grid of colored divs (not Recharts) for per-core visualization

---

### Zustand 5 — State Management

**What:** Small, fast, and scalable state-management for React.

**Why:** Redux adds boilerplate. React Context re-renders the entire subtree on every WebSocket tick (1 Hz × all metrics = perceptible jank). Zustand's shallow equality selectors ensure only the chart subscribed to a specific data slice re-renders when its data changes.

**How:** `hooks/useMetricsStore.ts` holds sliding 60-item windows (`cpuHistory`, `memoryHistory`, `diskHistory`, `netHistory`) and latest snapshots. `pushSnapshot()` is called from `useWebSocket.ts` on every incoming `type: "metrics"` message.

---

### Tailwind CSS 4 — Styling

**What:** Utility-first CSS framework.

**Why:** Zero runtime overhead — all CSS is generated at build time. Consistent design tokens (`gray-900`, `indigo-600`, etc.) create a coherent dark theme across 20+ components without a single custom CSS file.

**How:** `globals.css` imports `@tailwindcss` and sets dark background CSS variables. Component files use utility classes directly: `bg-gray-900 border border-gray-800 rounded-xl p-4`.

---

### lucide-react — Icons

**What:** Beautiful and consistent SVG icon library for React (1000+ icons).

**Why:** Tree-shakeable — only imported icons are bundled. Consistent 24×24 grid matches Tailwind spacing. Icons passed as props to `MetricCard` keep the design system extensible.

**How:** `Cpu`, `MemoryStick`, `HardDrive`, `Activity`, `Play`, `ScrollText`, `LayoutDashboard`, `Layers`, `ChevronUp`, `ChevronDown`, `RefreshCw` — imported individually and rendered as `<Icon size={16} />`.

---

### next-intl 3 — Internationalization

**What:** Internationalization library designed specifically for Next.js App Router.

**Why:** First-class App Router support with `[locale]` routing. Server components use `getTranslations()`, client components use `useTranslations()` — same API. Messages are loaded per-request with no global bundle overhead.

**How:**
- `i18n/routing.ts` — defines `locales: ['en', 'es']` and `defaultLocale: 'en'`
- `middleware.ts` — intercepts all requests and redirects `/` → `/en`
- `messages/en.json` and `messages/es.json` — all UI strings organized by component namespace
- `LanguageSwitcher` component patches the locale segment in the current URL path

---

### clsx 2 — Utilities

**What:** Tiny utility for constructing conditional `className` strings.

**Why:** Replaces verbose ternary expressions for conditional CSS. Particularly useful for status badges and connection status dots where multiple conditions map to different class combinations.

**How:** Used in `Sidebar` (active link), `ProcessTable` (status badges), `IoPanel` (device active/idle), `TopBar` (connection dot animation).

---

## Architecture Summary

```
Browser (Next.js 14)
  └── WebSocket ──────────────────────────────────────┐
  └── HTTP /api/* (rewrite proxy) ──────────────────┐ │
                                                     │ │
Python Backend (FastAPI + Uvicorn)                   │ │
  ├── psutil polls OS every 1s ──────────────────────┘ │
  ├── numpy AI workloads ─────────────────────────────┘
  ├── Pydantic validates all data shapes
  └── WebSocket /ws/metrics broadcasts to all clients
```
