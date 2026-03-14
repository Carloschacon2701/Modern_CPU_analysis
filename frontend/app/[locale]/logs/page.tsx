"use client";

import { useTranslations } from "next-intl";
import { LogViewer } from "@/components/logs/LogViewer";

export default function LogsPage() {
  const t = useTranslations("logs");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-white text-2xl font-bold">{t("title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("description")}</p>
      </div>
      <LogViewer />
    </div>
  );
}
