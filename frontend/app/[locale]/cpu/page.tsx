"use client";

import { useTranslations } from "next-intl";
import { CpuPanel } from "@/components/monitors/CpuPanel";

export default function CpuPage() {
  const t = useTranslations("cpu");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-white text-2xl font-bold">{t("title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("description")}</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <CpuPanel />
      </div>
    </div>
  );
}
