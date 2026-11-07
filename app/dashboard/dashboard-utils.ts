
import type {
  Bug,
  DashboardStats,
  TeamStat,
  StatusChartItem,
} from "./types";

import { STATUS_COLORS } from "./contants";


export function isFixed(status: string): boolean {
  const normalizedStatus = status.trim().toLocaleLowerCase();

  return (
    normalizedStatus.includes("נגמר") ||
    normalizedStatus.includes("נסגר")
  );
}

// Calculate dashboard statistics.
export function getBugStats(bugs: Bug[]): DashboardStats {
  const total = bugs.length;

  const fixed = bugs.filter((bug) =>
    isFixed(bug.status || "")
  ).length;

  const unresolved = total - fixed;

  const teams = new Set(
    bugs.map((bug) => bug.team?.trim()).filter(Boolean)
  ).size;

  const completionRate =
    total > 0 ? Math.round((fixed / total) * 100) : 0;

  return {
    total,
    fixed,
    unresolved,
    teams,
    completionRate,
  };
}

// Calculate statistics per team.
export function getTeamStats(bugs: Bug[]): TeamStat[] {
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
}

// Calculate status distribution.
export function getStatusChartData(
  bugs: Bug[]
): StatusChartItem[] {
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
}

// Get unique teams.
export function getTeams(bugs: Bug[]): string[] {
  return Array.from(
    new Set(
      bugs.map((bug) => bug.team?.trim()).filter(Boolean)
    )
  ).sort();
}

// Get unique statuses.
export function getStatuses(bugs: Bug[]): string[] {
  return Array.from(
    new Set(
      bugs.map((bug) => bug.status?.trim()).filter(Boolean)
    )
  ).sort();
}

// Parse date without timezone shifts for YYYY-MM-DD strings.
function parseBugDate(openDate: Date | string): Date | null {
  if (
    typeof openDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(openDate)
  ) {
    const [year, month, day] = openDate.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    // Validate the actual calendar date.
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(openDate);

  return Number.isNaN(date.getTime()) ? null : date;
}

// Calculate bug age in working days.
// Sunday - Thursday = working days.
// Friday and Saturday = excluded.
// Opening date itself is not counted.
export function getBugAge(openDate: Date | string): number {
  const date = parseBugDate(openDate);

  if (!date) return 0;

  const now = new Date();

  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  if (start >= today) return 0;

  let workingDays = 0;

  const current = new Date(start);

  // Start counting from the day after opening.
  current.setDate(current.getDate() + 1);

  while (current <= today) {
    const day = current.getDay();

    // Friday = 5, Saturday = 6.
    if (day !== 5 && day !== 6) {
      workingDays++;
    }

    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

export function formatDate(date: Date | string): string {
  const parsedDate = parseBugDate(date);

  if (!parsedDate) return "-";

  const day = String(parsedDate.getDate()).padStart(2, "0");
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const year = parsedDate.getFullYear();

  return `${day}/${month}/${year}`;
}

// Return only unresolved bugs.
export function getUnresolvedBugs(bugs: Bug[]): Bug[] {
  return bugs.filter((bug) => !isFixed(bug.status || ""));
}

// Calculate bug age for optional dates.
export function calculateWorkingDays(
  openDate: string | Date | undefined
): number | "" {
  if (!openDate) return "";

  return getBugAge(openDate);
}

