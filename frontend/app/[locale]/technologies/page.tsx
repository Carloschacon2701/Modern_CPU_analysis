"use client";

import { useTranslations } from "next-intl";

interface Tech {
  name: string;
  version: string;
  category: string;
  categoryKey: string;
  what: string;
  why: string;
  how: string;
  url: string;
  badge: string;
}

const BACKEND_TECHS: Tech[] = [
  {
    name: "Python 3.9",
    version: "3.9",
    category: "Runtime",
    categoryKey: "runtime",
    badge: "#3776AB",
    url: "https://python.org",
    what: "General-purpose high-level programming language used for the entire backend.",
    why: "Excellent ecosystem for system programming (psutil), scientific computing (numpy), and web APIs (FastAPI). Readable syntax speeds up development.",
    how: "All backend modules, monitors, simulation workloads, and API routes are written in Python. The venv at backend/.venv isolates dependencies.",
  },
  {
    name: "FastAPI",
    version: "0.115",
    category: "Framework",
    categoryKey: "framework",
    badge: "#009688",
    url: "https://fastapi.tiangolo.com",
    what: "Modern async Python web framework for building REST APIs and WebSocket endpoints.",
    why: "Native async/await support shares one event loop between WebSocket broadcasting and HTTP request handling — no extra threads or proxies needed. Auto-generates OpenAPI docs at /docs.",
    how: "Defines all REST routes (/api/metrics, /api/simulation, /api/logs) and the WebSocket endpoint (/ws/metrics). Uses Pydantic models for request/response validation. Lifespan context manager starts the background collection task.",
  },
  {
    name: "Uvicorn",
    version: "0.30",
    category: "ASGI Server",
    categoryKey: "server",
    badge: "#499848",
    url: "https://www.uvicorn.org",
    what: "Lightning-fast ASGI server that runs FastAPI in production and development.",
    why: "ASGI (Asynchronous Server Gateway Interface) is required to handle concurrent WebSocket connections alongside HTTP. Uvicorn uses uvloop and httptools for maximum throughput.",
    how: "Launched via uvicorn main:app --reload. Handles HTTP/1.1, WebSocket upgrades, graceful shutdown, and hot-reload in development.",
  },
  {
    name: "psutil",
    version: "6.0",
    category: "System Metrics",
    categoryKey: "system",
    badge: "#E34C26",
    url: "https://psutil.readthedocs.io",
    what: "Cross-platform library for retrieving process and system utilization information.",
    why: "Wraps OS-specific syscalls (proc filesystem on Linux, sysctl on macOS) into a clean Python API. Works on macOS for development and Linux for deployment without code changes.",
    how: "Used in all four monitor modules: cpu_monitor.py (cpu_percent, cpu_freq, cpu_times), memory_monitor.py (virtual_memory, swap_memory), io_monitor.py (disk_io_counters, net_io_counters), process_monitor.py (process_iter, Process.threads).",
  },
  {
    name: "NumPy",
    version: "≥1.24",
    category: "Scientific Computing",
    categoryKey: "scientific",
    badge: "#013243",
    url: "https://numpy.org",
    what: "Fundamental package for numerical computing in Python — N-dimensional arrays and linear algebra.",
    why: "Enables the AI innovation workloads to run fast matrix operations without heavy ML frameworks. The matrix multiply benchmark (A @ B) uses numpy's BLAS-optimized routines, producing measurable CPU and memory pressure.",
    how: "Used in ai_workload.py for three algorithms: (1) float32 matrix multiply of size×size arrays, (2) K-means Lloyd's iteration using np.linalg.norm, (3) mini neural network with sigmoid activations and manual backprop using pure numpy operations.",
  },
  {
    name: "Pydantic",
    version: "2.9",
    category: "Data Validation",
    categoryKey: "validation",
    badge: "#E92063",
    url: "https://docs.pydantic.dev",
    what: "Data validation and serialization library using Python type annotations.",
    why: "Guarantees that every MetricsSnapshot sent over WebSocket has valid types. The TypeScript interfaces in metrics-types.ts mirror Pydantic models exactly — if the Python schema changes, TypeScript will catch the mismatch.",
    how: "All metrics models (MetricsSnapshot, CpuSnapshot, MemorySnapshot, IoSnapshot, ProcessEntry) are Pydantic BaseModels. model_dump() serializes to dict for JSON broadcasting. Field() adds documentation strings visible in /docs.",
  },
  {
    name: "WebSockets (RFC 6455)",
    version: "protocol",
    category: "Protocol",
    categoryKey: "protocol",
    badge: "#6366f1",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSocket",
    what: "Full-duplex communication protocol over a single TCP connection.",
    why: "Polling the REST endpoint every second would create unnecessary HTTP overhead and introduce latency. WebSocket push delivers metrics immediately when collected, enabling true real-time charts.",
    how: "Backend: FastAPI @app.websocket('/ws/metrics') endpoint. Broadcaster fans out JSON to all connected clients using asyncio.gather. Frontend: custom WebSocketClient class in lib/websocket-client.ts with exponential backoff reconnect.",
  },
];

const FRONTEND_TECHS: Tech[] = [
  {
    name: "Next.js 14",
    version: "14.x",
    category: "Framework",
    categoryKey: "framework",
    badge: "#000000",
    url: "https://nextjs.org",
    what: "React framework with App Router, server components, file-based routing, and built-in optimizations.",
    why: "App Router provides locale-based routing ([locale] segment) out of the box. next-intl integrates natively. The rewrite in next.config.ts proxies /api/* to the Python backend, avoiding CORS issues in development.",
    how: "All pages live under app/[locale]/ for i18n routing. The layout.tsx provides NextIntlClientProvider for translations. next.config.ts uses createNextIntlPlugin and rewrites to proxy API calls.",
  },
  {
    name: "TypeScript",
    version: "5.x",
    category: "Language",
    categoryKey: "language",
    badge: "#3178C6",
    url: "https://www.typescriptlang.org",
    what: "Typed superset of JavaScript that compiles to plain JavaScript.",
    why: "The metrics-types.ts file mirrors the Python Pydantic models exactly. TypeScript catches mismatches between what the WebSocket sends and what components expect — critical when the backend schema evolves.",
    how: "All .ts and .tsx files use strict TypeScript. Interface types in lib/metrics-types.ts define the contract with the Python backend. Zustand store types ensure correct data shapes flow through all chart components.",
  },
  {
    name: "Recharts",
    version: "2.x",
    category: "Charting",
    categoryKey: "charts",
    badge: "#22c55e",
    url: "https://recharts.org",
    what: "Composable charting library built on React and D3.",
    why: "React component model integrates with the render cycle naturally. Unlike Chart.js which requires imperative canvas manipulation via refs, Recharts re-renders when data changes following React's data-flow model. isAnimationActive={false} on Line components is critical for 1 Hz updates.",
    how: "TimeSeriesChart wraps LineChart with a sliding 60-point window. GaugeChart uses RadialBarChart in half-circle mode with color interpolation. All charts receive data directly from Zustand store slices via hooks.",
  },
  {
    name: "Zustand",
    version: "5.x",
    category: "State Management",
    categoryKey: "stateManagement",
    badge: "#764ABC",
    url: "https://zustand-demo.pmnd.rs",
    what: "Small, fast, and scalable state management for React using hooks.",
    why: "Redux adds boilerplate. React Context re-renders the entire subtree on every WebSocket tick (1 Hz × all metrics = jank). Zustand's shallow equality selectors ensure only the chart subscribed to a specific data slice re-renders when its data changes.",
    how: "useMetricsStore in hooks/useMetricsStore.ts holds sliding windows (cpuHistory, memoryHistory, diskHistory, netHistory) and latest snapshots. pushSnapshot() is called from useWebSocket.ts on every incoming metrics message.",
  },
  {
    name: "Tailwind CSS",
    version: "4.x",
    category: "Styling",
    categoryKey: "styling",
    badge: "#38BDF8",
    url: "https://tailwindcss.com",
    what: "Utility-first CSS framework for rapidly building custom designs.",
    why: "Zero runtime overhead — all CSS is compiled at build time. Consistent design tokens (gray-900, indigo-600, etc.) create a coherent dark theme across 20+ components without a single custom CSS class.",
    how: "globals.css imports @tailwindcss and overrides CSS variables for the dark background. Component files use utility classes directly — no CSS modules or styled-components needed.",
  },
  {
    name: "lucide-react",
    version: "0.x",
    category: "Icons",
    categoryKey: "icons",
    badge: "#F56565",
    url: "https://lucide.dev",
    what: "Beautiful and consistent icon library for React with 1000+ SVG icons.",
    why: "Tree-shakeable — only imported icons are included in the bundle. Consistent 24×24 grid matches Tailwind spacing. Icons are used as props to components (MetricCard, Sidebar) keeping design extensible.",
    how: "Cpu, MemoryStick, HardDrive, Activity, Play, ScrollText, LayoutDashboard, Layers, ChevronUp, ChevronDown, RefreshCw — all imported individually and rendered as <Icon size={16} />.",
  },
  {
    name: "next-intl",
    version: "3.x",
    category: "Internationalization",
    categoryKey: "i18n",
    badge: "#6366f1",
    url: "https://next-intl-docs.vercel.app",
    what: "Internationalization library designed specifically for Next.js App Router.",
    why: "First-class App Router support with [locale] routing out of the box. Server components use getTranslations(), client components use useTranslations() — same API, no context boilerplate. Messages are loaded per-request, not bundled globally.",
    how: "i18n/routing.ts defines locales ['en','es']. middleware.ts intercepts requests and redirects / → /en. messages/en.json and messages/es.json contain all UI strings. LanguageSwitcher component patches the locale segment in the current URL.",
  },
  {
    name: "clsx",
    version: "2.x",
    category: "Utilities",
    categoryKey: "utilities",
    badge: "#64748b",
    url: "https://github.com/lukeed/clsx",
    what: "Tiny utility for constructing conditional className strings.",
    why: "Replacing long ternary expressions for conditional CSS classes. Particularly useful for status badges (running→green, sleeping→yellow, other→gray) and connection status dots.",
    how: "Used in Sidebar (active link highlight), ProcessTable (status badge colors), IoPanel (device active/idle badge), TopBar (status dot animation). clsx({ 'bg-green-900': running }) is more readable than template literals.",
  },
];

export default function TechnologiesPage() {
  const t = useTranslations("technologies");
  const tc = useTranslations("technologies.categories");

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-white text-2xl font-bold">{t("title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("description")}</p>
      </div>

      <Section title={t("sections.backend")} color="#3776AB" techs={BACKEND_TECHS} tc={tc} />
      <Section title={t("sections.frontend")} color="#000000" techs={FRONTEND_TECHS} tc={tc} />
    </div>
  );
}

function Section({
  title,
  color,
  techs,
  tc,
}: {
  title: string;
  color: string;
  techs: Tech[];
  tc: (key: string) => string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: color }} />
        <h2 className="text-white text-xl font-bold">{title}</h2>
        <span className="text-gray-500 text-sm">{techs.length} technologies</span>
      </div>
      <div className="space-y-3">
        {techs.map((tech) => (
          <TechCard key={tech.name} tech={tech} tc={tc} />
        ))}
      </div>
    </div>
  );
}

function TechCard({ tech, tc }: { tech: Tech; tc: (key: string) => string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-800">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: tech.badge }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-white font-bold text-base">{tech.name}</span>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded font-mono">
              v{tech.version}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${tech.badge}22`,
                color: tech.badge === "#000000" ? "#9ca3af" : tech.badge,
              }}
            >
              {tc(tech.categoryKey)}
            </span>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wide mb-1">
            What
          </p>
          <p className="text-gray-300 leading-relaxed">{tech.what}</p>
        </div>
        <div>
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-1">
            Why
          </p>
          <p className="text-gray-300 leading-relaxed">{tech.why}</p>
        </div>
        <div>
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-1">
            How
          </p>
          <p className="text-gray-300 leading-relaxed">{tech.how}</p>
        </div>
      </div>
    </div>
  );
}
