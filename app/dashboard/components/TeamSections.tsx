"use client";

import { ChartPie, ChevronDown } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

import type {
  DashboardStats,
  StatusChartItem,
  TeamStat,
} from "../types";

export function StatusBreakdown({
  stats,
  statusChartData,
}: {
  stats: DashboardStats;
  statusChartData: StatusChartItem[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <ChartPie size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              התפלגות באגים פתוחים לפי סטטוס
            </h2>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            בחינת התפלגות הבאגים לפי מצב הטיפול הנוכחי שלהם.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl bg-slate-50 px-4 py-2 sm:self-auto">
          <span className="text-xs text-slate-500">סך הכול באגים פתוחים</span>
          <span className="text-lg font-bold text-slate-900">
            {stats.total}
          </span>
        </div>
      </div>

      <div
        className="h-[540px] overflow-y-scroll overscroll-contain p-5 sm:p-6"
        style={{ scrollbarGutter: "stable", scrollbarWidth: "auto" }}
      >
        {statusChartData.length > 0 ? (
          <div className="min-h-[850px]">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-6">
              <div className="relative h-[370px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="48%"
                      innerRadius={90}
                      outerRadius={135}
                      paddingAngle={3}
                      stroke="white"
                      strokeWidth={3}
                    >
                      {statusChartData.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value, name) => [`${value} באגים`, name]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                      }}
                    />

                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "12px",
                        paddingTop: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-5">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">
                    {stats.total}
                  </span>
                  <span className="mt-1 text-sm text-slate-500">
                    סך הכול באגים
                  </span>
                  <span className="mt-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    {statusChartData.length} סטטוסים
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    פירוט לפי סטטוס
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    כמות ואחוז מכלל הבאגים עבור כל סטטוס
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {statusChartData.length} קטגוריות
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {statusChartData.map((item) => (
                  <div
                    key={item.status}
                    className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="mt-1 h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {item.status}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {item.percentage.toFixed(1)}% מכלל הבאגים
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xl font-bold text-slate-900">
                          {item.count}
                        </p>
                        <p className="text-xs text-slate-400">באגים</p>
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.fill,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
            <ChartPie size={42} className="text-slate-300" />
            <h3 className="mt-4 font-semibold text-slate-700">
              אין נתונים להצגת סטטוסים
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              נתוני סטטוס יופיעו כאן לאחר הוספת באגים למערכת.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-3">
        <p className="text-xs text-slate-500">ניתוח סטטוסים</p>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ChevronDown size={14} />
          גלול לצפייה בנתונים נוספים
        </div>
      </div>
    </section>
  );
}

export function TeamRanking({ teamStats }: { teamStats: TeamStat[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">
          דירוג צוותים לפי שיעור טיפול
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          השוואת שיעור הטיפול בבאגים בין הצוותים
        </p>
      </div>

      {teamStats.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-right">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400">
                <th className="px-4 py-3 font-semibold">צוות</th>
                <th className="px-4 py-3 font-semibold">סך הכול</th>
                <th className="px-4 py-3 font-semibold">טופלו</th>
                <th className="px-4 py-3 font-semibold">פתוחים</th>
                <th className="px-4 py-3 font-semibold">שיעור טיפול</th>
              </tr>
            </thead>

            <tbody>
              {teamStats.map((team, index) => (
                <tr
                  key={team.team}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {team.team}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-700">
                    {team.total}
                  </td>
                  <td className="px-4 py-4 font-medium text-emerald-600">
                    {team.fixed}
                  </td>
                  <td className="px-4 py-4 font-medium text-amber-600">
                    {team.unresolved}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${team.rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700">
                        {team.rate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">
          אין נתונים להצגת צוותים
        </p>
      )}
    </section>
  );
}