
"use client";

import { useMemo } from "react";

import DashboardHeader from "./DashboardHeader";
import StatsGrid from "./StatsGrid";

import {
  ResolutionChart,
  TeamPerformance,
} from "./DashboardCharts";

import {
  StatusBreakdown,
  TeamRanking,
} from "./TeamSections";

import BugDetails from "./BugDetails";

import { useDashboardData } from "./useDashboardData";
import { isFixed } from "./types";

import type { DashboardProps } from "./types";

export type { Bug } from "./types";

export default function Dashboard({
  bugs,
  onReset,
}: DashboardProps) {

  // All bugs: used by the main dashboard charts and statistics
  const {
    stats,
    teamStats,
    teams,
    statuses,
  } = useDashboardData(bugs);

  // Only unresolved bugs: used by the status breakdown chart
  const unresolvedBugs = useMemo(() => {
    return bugs.filter((bug) => {
      const status = String(bug.status ?? "").trim();

      return (
        !isFixed(bug.status) &&
        !status.includes("נגמר")
      );
    });
  }, [bugs]);

  // Calculate status distribution only for unresolved bugs
  const unresolvedData = useDashboardData(unresolvedBugs);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 p-4 md:p-8"
    >
      <div className="mx-auto max-w-[1600px] space-y-8">

        <DashboardHeader onReset={onReset} />

        {/* Main statistics - ALL bugs */}
        <StatsGrid stats={stats} />

        {/* Charts - ALL bugs */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ResolutionChart stats={stats} />

          <TeamPerformance teamStats={teamStats} />
        </section>

        {/* Status breakdown - ONLY unresolved bugs */}
        <StatusBreakdown
          stats={unresolvedData.stats}
          statusChartData={unresolvedData.statusChartData}
        />

        {/* Team ranking - ALL bugs */}
        <TeamRanking teamStats={teamStats} />

        {/* Bug details */}
        <BugDetails
          bugs={bugs}
          teams={teams}
          statuses={statuses}
        />

        <footer className="pb-4 text-center text-xs text-slate-400">
          מערכת לניהול ומעקב באגים · לוח בקרה ניהולי
        </footer>

      </div>
    </main>
  );
}
