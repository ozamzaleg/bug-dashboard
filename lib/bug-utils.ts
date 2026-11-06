import { Bug, isFixed } from "@/components/dashboard/types";

export function getBugStats(bugs: Bug[]) {
  const total = bugs.length;

  const fixed = bugs.filter((bug) =>
    isFixed(bug.status)
  ).length;

  const unresolved = total - fixed;

  const teams = new Set(
    bugs.map((bug) => bug.team)
  ).size;

  const completionRate =
    total > 0 ? (fixed / total) * 100 : 0;

  return {
    total,
    fixed,
    unresolved,
    teams,
    completionRate,
  };
}

export function getBugAge(openDate: Date): number {
  const now = new Date();

  const start = new Date(
    openDate.getFullYear(),
    openDate.getMonth(),
    openDate.getDate()
  );

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return Math.max(
    0,
    Math.floor(
      (today.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB");
}