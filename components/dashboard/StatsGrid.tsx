"use client";

import {
  Bug as BugIcon,
  CheckCircle2,
  AlertCircle,
  Users,
} from "lucide-react";

import StatCard from "./StatCard";
import type { DashboardStats } from "./types";

type Props = {
  stats: DashboardStats;
};

export default function StatsGrid({ stats }: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="סך כל הבאגים"
        value={stats.total}
        description="כלל הבאגים שנרשמו במערכת"
        icon={<BugIcon size={22} className="text-blue-600" />}
        color="bg-blue-50"
      />

      <StatCard
        title="באגים שטופלו"
        value={stats.fixed}
        description="באגים שסומנו כהושלמו"
        icon={<CheckCircle2 size={22} className="text-emerald-600" />}
        color="bg-emerald-50"
      />

      <StatCard
        title="באגים שטרם טופלו"
        value={stats.unresolved}
        description="באגים שעדיין דורשים טיפול"
        icon={<AlertCircle size={22} className="text-amber-600" />}
        color="bg-amber-50"
      />

      <StatCard
        title="צוותים פעילים"
        value={stats.teams}
        description={`${stats.completionRate}% שיעור טיפול כולל`}
        icon={<Users size={22} className="text-violet-600" />}
        color="bg-violet-50"
      />
    </section>
  );
}