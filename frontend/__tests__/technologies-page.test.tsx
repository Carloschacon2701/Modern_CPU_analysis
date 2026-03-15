import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock next-intl so every t(key) call returns the namespaced key path as a
// plain string, e.g. t("columns.what") → "technologies.columns.what".
// This lets assertions target predictable strings without needing a real
// i18n runtime or message files loaded at test time.
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) =>
    (key: string, _values?: Record<string, string | number>) =>
      `${namespace}.${key}`,
}));

import TechnologiesPage from "@/app/[locale]/technologies/page";

// ---------------------------------------------------------------------------
// Helpers — keep the expected tech lists co-located with the tests so that
// any change to the page's data arrays will cause a test failure here rather
// than silently slipping through.
// ---------------------------------------------------------------------------

const BACKEND_ITEM_KEYS = [
  "python",
  "fastapi",
  "uvicorn",
  "psutil",
  "numpy",
  "pydantic",
  "websockets",
] as const;

const FRONTEND_ITEM_KEYS = [
  "nextjs",
  "typescript",
  "recharts",
  "zustand",
  "tailwindcss",
  "lucideReact",
  "nextIntl",
  "clsx",
] as const;

const BACKEND_TECHS = [
  { name: "Python 3.9", version: "3.9", categoryKey: "runtime", itemKey: "python" },
  { name: "FastAPI", version: "0.115", categoryKey: "framework", itemKey: "fastapi" },
  { name: "Uvicorn", version: "0.30", categoryKey: "server", itemKey: "uvicorn" },
  { name: "psutil", version: "6.0", categoryKey: "system", itemKey: "psutil" },
  { name: "NumPy", version: "≥1.24", categoryKey: "scientific", itemKey: "numpy" },
  { name: "Pydantic", version: "2.9", categoryKey: "validation", itemKey: "pydantic" },
  {
    name: "WebSockets (RFC 6455)",
    version: "protocol",
    categoryKey: "protocol",
    itemKey: "websockets",
  },
] as const;

const FRONTEND_TECHS = [
  { name: "Next.js 14", version: "14.x", categoryKey: "framework", itemKey: "nextjs" },
  { name: "TypeScript", version: "5.x", categoryKey: "language", itemKey: "typescript" },
  { name: "Recharts", version: "2.x", categoryKey: "charts", itemKey: "recharts" },
  { name: "Zustand", version: "5.x", categoryKey: "stateManagement", itemKey: "zustand" },
  { name: "Tailwind CSS", version: "4.x", categoryKey: "styling", itemKey: "tailwindcss" },
  { name: "lucide-react", version: "0.x", categoryKey: "icons", itemKey: "lucideReact" },
  { name: "next-intl", version: "3.x", categoryKey: "i18n", itemKey: "nextIntl" },
  { name: "clsx", version: "2.x", categoryKey: "utilities", itemKey: "clsx" },
] as const;

// ---------------------------------------------------------------------------
// Suite 1 — Page-level rendering
// ---------------------------------------------------------------------------

describe("TechnologiesPage — title and description", () => {
  it("renders the page title from the technologies namespace", () => {
    render(<TechnologiesPage />);
    expect(screen.getByText("technologies.title")).toBeInTheDocument();
  });

  it("renders the page description from the technologies namespace", () => {
    render(<TechnologiesPage />);
    expect(screen.getByText("technologies.description")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — Section headings and tech count labels
// ---------------------------------------------------------------------------

describe("TechnologiesPage — section headings", () => {
  it("renders the backend section heading", () => {
    render(<TechnologiesPage />);
    expect(screen.getByText("technologies.sections.backend")).toBeInTheDocument();
  });

  it("renders the frontend section heading", () => {
    render(<TechnologiesPage />);
    expect(screen.getByText("technologies.sections.frontend")).toBeInTheDocument();
  });
});

describe("TechnologiesPage — tech count labels", () => {
  // The mock produces "technologies.count" for both calls because the values
  // object is ignored by the identity mock.  Both Section components call
  // t("count", { count: N }) so the same string appears twice in the DOM.
  it("renders the count label for both sections", () => {
    render(<TechnologiesPage />);
    // getAllByText returns all matches; we expect exactly two (backend + frontend)
    const countLabels = screen.getAllByText("technologies.count");
    expect(countLabels).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — Column headers (What / Why / How)
// ---------------------------------------------------------------------------

describe("TechnologiesPage — column headers", () => {
  it("renders the 'what' column header for every tech card", () => {
    render(<TechnologiesPage />);
    // 7 backend + 8 frontend = 15 total cards, each with a what/why/how header
    const whatHeaders = screen.getAllByText("technologies.columns.what");
    expect(whatHeaders).toHaveLength(15);
  });

  it("renders the 'why' column header for every tech card", () => {
    render(<TechnologiesPage />);
    const whyHeaders = screen.getAllByText("technologies.columns.why");
    expect(whyHeaders).toHaveLength(15);
  });

  it("renders the 'how' column header for every tech card", () => {
    render(<TechnologiesPage />);
    const howHeaders = screen.getAllByText("technologies.columns.how");
    expect(howHeaders).toHaveLength(15);
  });
});

// ---------------------------------------------------------------------------
// Suite 4 — TechCard rendering (name, version badge, category badge, body)
// ---------------------------------------------------------------------------

describe("TechnologiesPage — TechCard: tech name and version badge", () => {
  it.each([...BACKEND_TECHS, ...FRONTEND_TECHS])(
    "renders the name '$name' for itemKey '$itemKey'",
    ({ name }) => {
      render(<TechnologiesPage />);
      expect(screen.getByText(name)).toBeInTheDocument();
    },
  );

  it.each([...BACKEND_TECHS, ...FRONTEND_TECHS])(
    "renders the version badge 'v$version' for '$name'",
    ({ version }) => {
      render(<TechnologiesPage />);
      // The component prefixes with "v", e.g. v3.9, v0.115.
      // Multiple techs may share the same version string (e.g. "5.x", "2.x")
      // so we use getAllByText and assert at least one match exists.
      expect(screen.getAllByText(`v${version}`).length).toBeGreaterThan(0);
    },
  );
});

describe("TechnologiesPage — TechCard: category badge", () => {
  it.each([...BACKEND_TECHS, ...FRONTEND_TECHS])(
    "renders the category badge for '$name' using key '$categoryKey'",
    ({ categoryKey }) => {
      render(<TechnologiesPage />);
      // The category badge calls tc(tech.categoryKey) which the mock resolves
      // to "technologies.categories.<categoryKey>"
      expect(
        screen.getAllByText(`technologies.categories.${categoryKey}`).length,
      ).toBeGreaterThan(0);
    },
  );
});

describe("TechnologiesPage — TechCard: what/why/how body content", () => {
  it.each([...BACKEND_TECHS, ...FRONTEND_TECHS])(
    "renders the 'what' body for '$name'",
    ({ itemKey }) => {
      render(<TechnologiesPage />);
      expect(
        screen.getByText(`technologies.items.${itemKey}.what`),
      ).toBeInTheDocument();
    },
  );

  it.each([...BACKEND_TECHS, ...FRONTEND_TECHS])(
    "renders the 'why' body for '$name'",
    ({ itemKey }) => {
      render(<TechnologiesPage />);
      expect(
        screen.getByText(`technologies.items.${itemKey}.why`),
      ).toBeInTheDocument();
    },
  );

  it.each([...BACKEND_TECHS, ...FRONTEND_TECHS])(
    "renders the 'how' body for '$name'",
    ({ itemKey }) => {
      render(<TechnologiesPage />);
      expect(
        screen.getByText(`technologies.items.${itemKey}.how`),
      ).toBeInTheDocument();
    },
  );
});

// ---------------------------------------------------------------------------
// Suite 5 — Total card count
// ---------------------------------------------------------------------------

describe("TechnologiesPage — total rendered cards", () => {
  it("renders exactly 7 backend tech cards", () => {
    render(<TechnologiesPage />);
    // Each card has a unique tech name; count the backend ones
    const backendNames = BACKEND_TECHS.map((t) => t.name);
    const rendered = backendNames.filter(
      (name) => screen.queryByText(name) !== null,
    );
    expect(rendered).toHaveLength(7);
  });

  it("renders exactly 8 frontend tech cards", () => {
    render(<TechnologiesPage />);
    const frontendNames = FRONTEND_TECHS.map((t) => t.name);
    const rendered = frontendNames.filter(
      (name) => screen.queryByText(name) !== null,
    );
    expect(rendered).toHaveLength(8);
  });

  it("renders 15 tech cards in total", () => {
    render(<TechnologiesPage />);
    // Every card renders "technologies.columns.what" once; counting those
    // nodes gives the total number of cards on screen.
    expect(screen.getAllByText("technologies.columns.what")).toHaveLength(15);
  });
});

// ---------------------------------------------------------------------------
// Suite 6 — Data-integrity: en.json has entries for every itemKey
// ---------------------------------------------------------------------------

import enMessages from "@/messages/en.json";

describe("en.json — data integrity for technologies.items", () => {
  const enItems = (enMessages as { technologies: { items: Record<string, unknown> } })
    .technologies.items;

  it("has an entry for every backend itemKey", () => {
    for (const key of BACKEND_ITEM_KEYS) {
      expect(enItems).toHaveProperty(key);
    }
  });

  it("has an entry for every frontend itemKey", () => {
    for (const key of FRONTEND_ITEM_KEYS) {
      expect(enItems).toHaveProperty(key);
    }
  });

  it.each([...BACKEND_ITEM_KEYS, ...FRONTEND_ITEM_KEYS])(
    "has non-empty 'what', 'why', and 'how' strings for '%s'",
    (key) => {
      const item = enItems[key] as { what: string; why: string; how: string };
      expect(item.what).toBeTruthy();
      expect(item.why).toBeTruthy();
      expect(item.how).toBeTruthy();
    },
  );

  it("covers exactly 15 items (7 backend + 8 frontend)", () => {
    const allKeys = [...BACKEND_ITEM_KEYS, ...FRONTEND_ITEM_KEYS];
    for (const key of allKeys) {
      expect(enItems).toHaveProperty(key);
    }
    // Guard against ghost keys that exist in en.json but are not in the page
    expect(Object.keys(enItems)).toHaveLength(15);
  });
});

// ---------------------------------------------------------------------------
// Suite 7 — Structural parity: en.json and es.json share identical key trees
//           for the technologies section
// ---------------------------------------------------------------------------

import esMessages from "@/messages/es.json";

type JsonNode = string | Record<string, JsonNode>;

/** Recursively collects every dot-separated key path under a node. */
function collectKeyPaths(node: JsonNode, prefix = ""): string[] {
  if (typeof node === "string") return [prefix];
  return Object.entries(node).flatMap(([k, v]) =>
    collectKeyPaths(v as JsonNode, prefix ? `${prefix}.${k}` : k),
  );
}

describe("en.json vs es.json — technologies key structure parity", () => {
  const enTech = (enMessages as { technologies: JsonNode }).technologies;
  const esTech = (esMessages as { technologies: JsonNode }).technologies;

  const enPaths = collectKeyPaths(enTech).sort();
  const esPaths = collectKeyPaths(esTech).sort();

  it("both locales have the same number of keys under 'technologies'", () => {
    expect(esPaths.length).toBe(enPaths.length);
  });

  it("every key present in en.json also exists in es.json", () => {
    for (const path of enPaths) {
      expect(esPaths).toContain(path);
    }
  });

  it("every key present in es.json also exists in en.json", () => {
    for (const path of esPaths) {
      expect(enPaths).toContain(path);
    }
  });

  it("both locales contain the 'items' sub-section", () => {
    expect(enTech).toHaveProperty("items");
    expect(esTech).toHaveProperty("items");
  });

  it("both locales contain the 'categories' sub-section", () => {
    expect(enTech).toHaveProperty("categories");
    expect(esTech).toHaveProperty("categories");
  });

  it("both locales contain the 'columns' sub-section", () => {
    expect(enTech).toHaveProperty("columns");
    expect(esTech).toHaveProperty("columns");
  });

  it("both locales contain the 'sections' sub-section", () => {
    expect(enTech).toHaveProperty("sections");
    expect(esTech).toHaveProperty("sections");
  });
});
