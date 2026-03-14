"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

const FLAG: Record<string, string> = {
  en: "🇬🇧",
  es: "🇪🇸",
};

const LABEL: Record<string, string> = {
  en: "EN",
  es: "ES",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchTo = (next: string) => {
    // Replace the locale segment in the path
    const segments = pathname.split("/");
    if (routing.locales.includes(segments[1] as "en" | "es")) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    router.push(segments.join("/") || "/");
  };

  return (
    <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5">
      {routing.locales.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            l === locale
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <span>{FLAG[l]}</span>
          <span>{LABEL[l]}</span>
        </button>
      ))}
    </div>
  );
}
