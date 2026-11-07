"use client";

import type { BugTableProps } from "../types";
import {
  formatDate,
  getBugAge,
  isFixed,
} from "../dashboard-utils";

export default function BugTable({ bugs }: BugTableProps) {
  return (
    <div dir="rtl" className="w-full overflow-x-auto">
      <table className="w-full min-w-[900px] text-right text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold text-slate-500">
          <tr>
            <th className="px-5 py-4">מספר תקלה / משימה</th>
            <th className="px-5 py-4">שם משימה / תקלה</th>
            <th className="px-5 py-4">צוות אחראי</th>
            <th className="px-5 py-4">תאריך פתיחה</th>
            <th className="px-5 py-4">זמן המתנה לטיפול</th>
            <th className="px-5 py-4">סטטוס</th>
            <th className="px-5 py-4">מצב טיפול</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {bugs.map((bug, index) => {
            const fixed = isFixed(bug.status ?? "");

            return (
              <tr
                key={`${bug.number}-${index}`}
                className="transition-colors hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                  {bug.number}
                </td>

                <td className="px-5 py-4 font-medium text-slate-700">
                  {bug.name}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                  {bug.team}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                  {formatDate(bug.openDate)}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                  {getBugAge(bug.openDate)} ימים
                </td>

                <td className="px-5 py-4">
                  <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                    {bug.status}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      fixed
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {fixed ? "טופל" : "לא טופל"}
                  </span>
                </td>
              </tr>
            );
          })}

          {bugs.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="px-5 py-12 text-center text-sm text-slate-500"
              >
                לא נמצאו באגים
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}