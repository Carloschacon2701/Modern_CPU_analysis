"use client";

import { useTranslations } from "next-intl";

type TFunction = ReturnType<typeof useTranslations>;

type ItemKey =
  | "python"
  | "fastapi"
  | "uvicorn"
  | "psutil"
  | "numpy"
  | "pydantic"
  | "websockets"
  | "nextjs"
  | "typescript"
  | "recharts"
  | "zustand"
  | "tailwindcss"
  | "lucideReact"
  | "nextIntl"
  | "clsx";

interface Tech {
  name: string;
  version: string;
  categoryKey: string;
  itemKey: ItemKey;
  url: string;
  badge: string;
}

const BACKEND_TECHS: Tech[] = [
  {
    name: "Python 3.9",
    version: "3.9",
    categoryKey: "runtime",
    itemKey: "python",
    badge: "#3776AB",
    url: "https://python.org",
  },
  {
    name: "FastAPI",
    version: "0.115",
    categoryKey: "framework",
    itemKey: "fastapi",
    badge: "#009688",
    url: "https://fastapi.tiangolo.com",
  },
  {
    name: "Uvicorn",
    version: "0.30",
    categoryKey: "server",
    itemKey: "uvicorn",
    badge: "#499848",
    url: "https://www.uvicorn.org",
  },
  {
    name: "psutil",
    version: "6.0",
    categoryKey: "system",
    itemKey: "psutil",
    badge: "#E34C26",
    url: "https://psutil.readthedocs.io",
  },
  {
    name: "NumPy",
    version: "≥1.24",
    categoryKey: "scientific",
    itemKey: "numpy",
    badge: "#013243",
    url: "https://numpy.org",
  },
  {
    name: "Pydantic",
    version: "2.9",
    categoryKey: "validation",
    itemKey: "pydantic",
    badge: "#E92063",
    url: "https://docs.pydantic.dev",
  },
  {
    name: "WebSockets (RFC 6455)",
    version: "protocol",
    categoryKey: "protocol",
    itemKey: "websockets",
    badge: "#6366f1",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSocket",
  },
];

const FRONTEND_TECHS: Tech[] = [
  {
    name: "Next.js 14",
    version: "14.x",
    categoryKey: "framework",
    itemKey: "nextjs",
    badge: "#000000",
    url: "https://nextjs.org",
  },
  {
    name: "TypeScript",
    version: "5.x",
    categoryKey: "language",
    itemKey: "typescript",
    badge: "#3178C6",
    url: "https://www.typescriptlang.org",
  },
  {
    name: "Recharts",
    version: "2.x",
    categoryKey: "charts",
    itemKey: "recharts",
    badge: "#22c55e",
    url: "https://recharts.org",
  },
  {
    name: "Zustand",
    version: "5.x",
    categoryKey: "stateManagement",
    itemKey: "zustand",
    badge: "#764ABC",
    url: "https://zustand-demo.pmnd.rs",
  },
  {
    name: "Tailwind CSS",
    version: "4.x",
    categoryKey: "styling",
    itemKey: "tailwindcss",
    badge: "#38BDF8",
    url: "https://tailwindcss.com",
  },
  {
    name: "lucide-react",
    version: "0.x",
    categoryKey: "icons",
    itemKey: "lucideReact",
    badge: "#F56565",
    url: "https://lucide.dev",
  },
  {
    name: "next-intl",
    version: "3.x",
    categoryKey: "i18n",
    itemKey: "nextIntl",
    badge: "#6366f1",
    url: "https://next-intl-docs.vercel.app",
  },
  {
    name: "clsx",
    version: "2.x",
    categoryKey: "utilities",
    itemKey: "clsx",
    badge: "#64748b",
    url: "https://github.com/lukeed/clsx",
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

      <Section title={t("sections.backend")} color="#3776AB" techs={BACKEND_TECHS} t={t} tc={tc} />
      <Section title={t("sections.frontend")} color="#000000" techs={FRONTEND_TECHS} t={t} tc={tc} />
    </div>
  );
}

function Section({
  title,
  color,
  techs,
  t,
  tc,
}: {
  title: string;
  color: string;
  techs: Tech[];
  t: TFunction;
  tc: TFunction;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: color }} />
        <h2 className="text-white text-xl font-bold">{title}</h2>
        <span className="text-gray-500 text-sm">{t("count", { count: techs.length })}</span>
      </div>
      <div className="space-y-3">
        {techs.map((tech) => (
          <TechCard key={tech.name} tech={tech} t={t} tc={tc} />
        ))}
      </div>
    </div>
  );
}

function TechCard({
  tech,
  t,
  tc,
}: {
  tech: Tech;
  t: TFunction;
  tc: TFunction;
}) {
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
            {t("columns.what")}
          </p>
          <p className="text-gray-300 leading-relaxed">{t(`items.${tech.itemKey}.what`)}</p>
        </div>
        <div>
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-1">
            {t("columns.why")}
          </p>
          <p className="text-gray-300 leading-relaxed">{t(`items.${tech.itemKey}.why`)}</p>
        </div>
        <div>
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-1">
            {t("columns.how")}
          </p>
          <p className="text-gray-300 leading-relaxed">{t(`items.${tech.itemKey}.how`)}</p>
        </div>
      </div>
    </div>
  );
}
