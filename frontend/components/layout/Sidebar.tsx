"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { clsx } from "clsx";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  Play,
  ScrollText,
  LayoutDashboard,
  Layers,
} from "lucide-react";

export function Sidebar() {
  const t = useTranslations("nav");
  const ts = useTranslations("sidebar");
  const locale = useLocale();
  const pathname = usePathname();

  const NAV_ITEMS = [
    { href: `/${locale}`, label: t("dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/cpu`, label: t("cpu"), icon: Cpu },
    { href: `/${locale}/memory`, label: t("memory"), icon: MemoryStick },
    { href: `/${locale}/io`, label: t("io"), icon: HardDrive },
    { href: `/${locale}/processes`, label: t("processes"), icon: Activity },
    { href: `/${locale}/simulation`, label: t("simulation"), icon: Play },
    { href: `/${locale}/logs`, label: t("logs"), icon: ScrollText },
    { href: `/${locale}/technologies`, label: t("technologies"), icon: Layers },
  ];

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-gray-800">
        <span className="text-white font-bold text-sm tracking-widest uppercase">
          {ts("title")}
        </span>
        <p className="text-gray-500 text-xs mt-0.5">{ts("subtitle")}</p>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === href
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
