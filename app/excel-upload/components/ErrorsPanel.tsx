"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { ValidationResult } from "../types";
import { downloadIssuesReport } from "../excel-utils";
import { ERROR_PREVIEW_LIMIT } from "../constants";

export default function ErrorsPanel({ report }: { report: ValidationResult }) {
  const [showAll, setShowAll] = useState(false);
  if (!report.issues.length) return null;

  const visibleIssues = showAll
    ? report.issues
    : report.issues.slice(0, ERROR_PREVIEW_LIMIT);

  return (
    <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-red-100 bg-red-50/70 p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-bold text-red-900">פירוט שגיאות</h2>
          <p className="mt-1 text-xs text-red-700">
            נמצאו {report.issues.length} שגיאות. ניתן להוריד דוח לתיקון.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadIssuesReport(report.issues)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          <Download size={16} /> הורדת דוח שגיאות
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-right text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-5 py-4">שורה</th>
              <th className="px-5 py-4">מספר באג</th>
              <th className="px-5 py-4">עמודה</th>
              <th className="px-5 py-4">ערך</th>
              <th className="px-5 py-4">הסבר</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleIssues.map((issue, index) => (
              <tr key={`${issue.row}-${issue.column}-${index}`}>
                <td className="px-5 py-4 font-bold">{issue.row}</td>
                <td className="px-5 py-4">{issue.number || "—"}</td>
                <td className="px-5 py-4">{issue.column}</td>
                <td className="max-w-[180px] truncate px-5 py-4">{issue.value || "ריק"}</td>
                <td className="px-5 py-4 text-red-700">{issue.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {report.issues.length > ERROR_PREVIEW_LIMIT && (
        <div className="border-t border-slate-100 p-4 text-center">
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="text-sm font-semibold text-blue-600"
          >
            {showAll ? "הצג פחות" : `הצג את כל ${report.issues.length} השגיאות`}
          </button>
        </div>
      )}
    </section>
  );
}
