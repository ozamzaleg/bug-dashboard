
"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

import type { DashboardStats, TeamStat } from "./types";
import { CHART_COLORS } from "./dashboard-utils";

export function ResolutionChart({
  stats,
}: {
  stats: DashboardStats;
}) {
  const data = [
    {
      name: "טופלו",
      value: stats.fixed,
      fill: CHART_COLORS.fixed,
    },
    {
      name: "טרם טופלו",
      value: stats.unresolved,
      fill: CHART_COLORS.unresolved,
    },
  ].filter((item) => item.value > 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">
          תמונת מצב הטיפול
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          השוואה בין באגים שטופלו לבאגים שטרם טופלו
        </p>
      </div>

      <div className="relative h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={105}
              paddingAngle={4}
              stroke="white"
              strokeWidth={3}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.fill}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value) => [
                `${value} באגים`,
                "כמות",
              ]}
            />

            <Legend
              verticalAlign="bottom"
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-6">
          <span className="text-3xl font-bold text-slate-900">
            {stats.completionRate}%
          </span>

          <span className="text-xs text-slate-500">
            שיעור טיפול
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-xs text-emerald-700">
            טופלו
          </p>

          <p className="mt-1 text-xl font-bold text-emerald-700">
            {stats.fixed}
          </p>
        </div>

        <div className="rounded-xl bg-amber-50 p-3">
          <p className="text-xs text-amber-700">
            טרם טופלו
          </p>

          <p className="mt-1 text-xl font-bold text-amber-700">
            {stats.unresolved}
          </p>
        </div>
      </div>
    </section>
  );
}

export function TeamPerformance({
  teamStats,
}: {
  teamStats: TeamStat[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
      <div className="mb-7 flex flex-col gap-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          השוואת ביצועי צוותים
        </h2>

        <p className="text-sm text-slate-500">
          כמות הבאגים שטופלו לעומת הבאגים שעדיין פתוחים בכל צוות
        </p>
      </div>

      {teamStats.length > 0 ? (
        <div className="space-y-7">
          {teamStats.map((team) => (
            <div
              key={team.team}
              className="space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-800">
                  {team.team}
                </span>

                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-500">
                    {team.total} באגים
                  </span>

                  <span className="font-bold text-blue-600">
                    {team.rate}% טופלו
                  </span>
                </div>
              </div>

              <div className="flex h-9 w-full overflow-hidden rounded-lg bg-slate-100">
                {team.fixed > 0 && (
                  <div
                    className="flex items-center justify-center bg-emerald-500 text-xs font-bold text-white transition-all duration-500"
                    style={{
                      width: `${(team.fixed / team.total) * 100}%`,
                    }}
                    title={`${team.fixed} באגים שטופלו`}
                  >
                    {team.fixed}
                  </div>
                )}

                {team.unresolved > 0 && (
                  <div
                    className="flex items-center justify-center bg-amber-400 text-xs font-bold text-amber-950 transition-all duration-500"
                    style={{
                      width: `${(team.unresolved / team.total) * 100}%`,
                    }}
                    title={`${team.unresolved} באגים שטרם טופלו`}
                  >
                    {team.unresolved}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-emerald-500" />

              <span className="text-xs font-medium text-slate-600">
                באגים שטופלו
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-amber-400" />

              <span className="text-xs font-medium text-slate-600">
                באגים שטרם טופלו
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
          אין נתונים להצגת צוותים
        </div>
      )}
    </section>
  );
}
