
import { CircleCheck } from "lucide-react";
import type { Bug } from "@/app/dashboard/types";
import { BUG_PREVIEW_LIMIT } from "../constants";
import { formatDate } from "@/app/dashboard/dashboard-utils";

export default function PreviewTable({ bugs }: { bugs: Bug[] }) {
  if (!bugs.length) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-center gap-3">
          <CircleCheck className="text-emerald-600" />
          <div>
            <h2 className="font-bold text-slate-900">
              תצוגה מקדימה של הנתונים התקינים
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {bugs.length} שורות מוכנות לייבוא
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-right text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-5 py-4">מספר תקלה / משימה</th>
              <th className="px-5 py-4">שם תקלה / משימה</th>
              <th className="px-5 py-4">צוות אחראי</th>
              <th className="px-5 py-4">תאריך פתיחה</th>
              <th className="px-5 py-4">סטטוס</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {bugs.slice(0, BUG_PREVIEW_LIMIT).map((bug, index) => (
              <tr key={`${bug.number}-${index}`}>
                <td className="px-5 py-4 font-semibold">{bug.number}</td>
                <td className="px-5 py-4">{bug.name}</td>
                <td className="px-5 py-4">{bug.team}</td>
                <td className="px-5 py-4">
                  {formatDate(bug.openDate)}
                </td>
                <td className="px-5 py-4">{bug.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bugs.length > BUG_PREVIEW_LIMIT && (
        <p className="border-t border-slate-100 p-3 text-center text-xs text-slate-400">
          מוצגות {BUG_PREVIEW_LIMIT} שורות ראשונות מתוך {bugs.length}
        </p>
      )}
    </section>
  );
}
