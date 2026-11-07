
import type { ReactNode } from "react";

export type Bug = {
  number: string;
  name: string;
  team: string;
  openDate: Date;
  status: string;
};

export type BugStats = {
  total: number;
  fixed: number;
  unresolved: number;
  teams: number;
  completionRate: number;
};

export type DashboardProps = {
  bugs: Bug[];
  onReset: () => void;
};

export type DashboardStats = {
  total: number;
  fixed: number;
  unresolved: number;
  teams: number;
  completionRate: number;
};

export type TeamStat = {
  team: string;
  total: number;
  fixed: number;
  unresolved: number;
  rate: number;
};

export type StatusChartItem = {
  status: string;
  count: number;
  percentage: number;
  fill: string;
};

export type BugDetailsProps = {
  bugs: Bug[];
  teams: string[];
  statuses: string[];
};

export type BugTableProps = {
  bugs: Bug[];
};

export type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  color: string;
};

