import { CheckCircle2, RefreshCw, Upload } from "lucide-react";
import type { ValidationResult } from "../types";
import StatCard from "./StatCard";
import { countRejectedRows } from "../excel-utils";

type Props = {
  report: ValidationResult;
  importedCount: number | null;
  onImport: () => void;
  onReset: () => void;
};

export default function ImportActions({
  report, importedCount, onImport, onReset,
}: Props) {
  if (importedCount !== null) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-white p-7 shadow-sm">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={28} className="text-emerald-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">הייבוא הושלם</h2>
            <p className="mt-1 text-sm text-slate-500">הנתונים התקינים הועברו ללוח הבקרה.</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="שורות שיובאו" value={importedCount} color="green" />
          <StatCard label="שורות שנדחו" value={countRejectedRows(report.issues)} color="red" />
          <StatCard label="שורות ריקות" value={report.emptyRows} color="amber" />
        </div>
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-700"
        >
          <RefreshCw size={17} /> ייבוא קובץ נוסף
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
      <div>
        <h2 className="font-bold text-slate-900">אישור העברת נתונים</h2>
        <p className="mt-1 text-sm text-slate-500">
          {report.validBugs.length} שורות תקינות יועברו ללוח הבקרה. שורות עם שגיאות לא יועברו.
        </p>
      </div>
      <button
        type="button"
        disabled={report.validBugs.length === 0}
        onClick={onImport}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300"
      >
        <Upload size={18} /> ייבוא {report.validBugs.length} שורות
      </button>
    </section>
  );
}
