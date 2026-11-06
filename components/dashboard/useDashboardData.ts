"use client";

import { useMemo } from "react";
import type { Bug, DashboardStats, TeamStat, StatusChartItem } from "./types";
import { STATUS_COLORS, isFixed } from "./dashboard-utils";

export function useDashboardData(bugs: Bug[]) {
  const stats = useMemo<DashboardStats>(() => {
    const total = bugs.length;
    const fixed = bugs.filter((bug) => isFixed(bug.status || "")).length;
    const unresolved = total - fixed;

    const teams = new Set(
      bugs.map((bug) => bug.team).filter(Boolean)
    ).size;

    const completionRate =
      total > 0 ? Math.round((fixed / total) * 100) : 0;

    return { total, fixed, unresolved, teams, completionRate };
  }, [bugs]);

  const teamStats = useMemo<TeamStat[]>(() => {
    const grouped: Record<string, TeamStat> = {};

    bugs.forEach((bug) => {
      const team = bug.team?.trim() || "לא משויך";

      if (!grouped[team]) {
        grouped[team] = {
          team,
          total: 0,
          fixed: 0,
          unresolved: 0,
          rate: 0,
        };
      }

      grouped[team].total++;

      if (isFixed(bug.status || "")) {
        grouped[team].fixed++;
      } else {
        grouped[team].unresolved++;
      }
    });

    return Object.values(grouped)
      .map((team) => ({
        ...team,
        rate:
          team.total > 0
            ? Math.round((team.fixed / team.total) * 100)
            : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [bugs]);

  const statusChartData = useMemo<StatusChartItem[]>(() => {
    const grouped: Record<string, number> = {};

    bugs.forEach((bug) => {
      const status = bug.status?.trim() || "ללא סטטוס";
      grouped[status] = (grouped[status] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([status, count], index) => ({
        status,
        count,
        percentage:
          bugs.length > 0 ? (count / bugs.length) * 100 : 0,
        fill: STATUS_COLORS[index % STATUS_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [bugs]);

  const teams = useMemo(
    () =>
      Array.from(
        new Set(bugs.map((bug) => bug.team).filter(Boolean))
      ).sort(),
    [bugs]
  );

  const statuses = useMemo(
    () =>
      Array.from(
        new Set(bugs.map((bug) => bug.status).filter(Boolean))
      ).sort(),
    [bugs]
  );

  return {
    stats,
    teamStats,
    statusChartData,
    teams,
    statuses,
  };
}