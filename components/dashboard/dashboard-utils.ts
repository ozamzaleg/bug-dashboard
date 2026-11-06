export const ITEMS_PER_PAGE = 10;

export const CHART_COLORS = {
  fixed: "#10B981",
  unresolved: "#F59E0B",
};

export const STATUS_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#f51f1f",
  "#8B5CF6",
  "#06B6D4",
  "#64748B",
  "#EC4899",
  "#14B8A6",
  "#f97316",
];

export function isFixed(status: string): boolean {
  return status.trim().toLocaleLowerCase().includes("נגמר");
}