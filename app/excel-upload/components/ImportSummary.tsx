import { ShieldCheck } from "lucide-react";
import type { ValidationResult } from "../types";
import StatCard from "./StatCard";
import { countRejectedRows } from "../excel-utils";

export default function ImportSummary({ report }: { report: ValidationResult }) {
  const percent = report.totalRows > 0
    ? Math.round((report.validBugs.length / report.totalRows) * 100)
    : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">תוצאות בדיקת התקינות</h2>
          <p className="mt-1 text-xs text-slate-500">סיכום כל השורות לאחר התאמת העמודות</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="סה״כ שורות" value={report.totalRows} color="blue" />
        <StatCard label="שורות תקינות" value={report.validBugs.length} color="green" />
        <StatCard label="שורות עם שגיאות" value={countRejectedRows(report.issues)} color="red" />
        <StatCard label="שורות ריקות" value={report.emptyRows} color="amber" />
      </div>

      <div className="mt-7">
        <div className="mb-3 flex justify-between text-sm">
          <span className="font-semibold text-slate-700">שיעור השורות התקינות</span>
          <span className="font-bold text-emerald-700">{percent}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </section>
  );
}
