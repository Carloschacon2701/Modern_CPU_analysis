"use client";

import { useTranslations } from "next-intl";
import { IoPanel } from "@/components/monitors/IoPanel";

export default function IoPage() {
  const t = useTranslations("io");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-white text-2xl font-bold">{t("title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("description")}</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <IoPanel />
      </div>
    </div>
  );
}
