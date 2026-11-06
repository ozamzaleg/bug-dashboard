"use client";

import { Activity, RotateCcw } from "lucide-react";

type Props = {
  onReset: () => void;
};

export default function DashboardHeader({ onReset }: Props) {
  return (
    <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-blue-600 p-2 text-white">
            <Activity size={22} />
          </div>

          <span className="text-sm font-semibold tracking-wider text-blue-600">
            ניהול ופיתוח תוכנה
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          לוח בקרה לניהול באגים
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          מעקב אחר באגים, ניתוח פעילות הצוותים וניהול התקדמות הטיפול.
        </p>
      </div>

      <button
        onClick={onReset}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
      >
        <RotateCcw size={16} />
        טעינת נתונים חדשים
      </button>
    </header>
  );
}