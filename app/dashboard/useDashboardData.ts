"use client";

import { useMemo } from "react";
import type { Bug } from "./types";

import {
  getBugStats,
  getTeamStats,
  getStatusChartData,
  getTeams,
  getStatuses,
} from "./dashboard-utils";

export function useDashboardData(bugs: Bug[]) {
  const stats = useMemo(
    () => getBugStats(bugs),
    [bugs]
  );

  const teamStats = useMemo(
    () => getTeamStats(bugs),
    [bugs]
  );

  const statusChartData = useMemo(
    () => getStatusChartData(bugs),
    [bugs]
  );

  const teams = useMemo(
    () => getTeams(bugs),
    [bugs]
  );

  const statuses = useMemo(
    () => getStatuses(bugs),
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