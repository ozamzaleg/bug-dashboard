
"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

import * as XLSX from "xlsx";

import BugTable from "./BugTable";
import type { Bug } from "./types";
import { ITEMS_PER_PAGE } from "./dashboard-utils";

type Props = {
  bugs: Bug[];
  teams: string[];
  statuses: string[];
};

// Calculate bug age in days
const calculateAge = (openDate: string | Date | undefined) => {
  if (!openDate) return "";

  const startDate = new Date(openDate);

  if (Number.isNaN(startDate.getTime())) return "";

  const today = new Date();

  const diff = today.getTime() - startDate.getTime();

  return Math.max(
    0,
    Math.floor(diff / (1000 * 60 * 60 * 24))
  );
};

export default function BugDetails({
  bugs,
  teams,
  statuses,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Search and filter bugs
  const filteredBugs = useMemo(() => {
    return bugs.filter((bug) => {
      const status = String(bug.status ?? "").trim();

      // Always exclude statuses containing "נגמר"
      const isNotFinished = !status.includes("נגמר");

      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        bug.number?.toLowerCase().includes(searchValue) ||
        bug.name?.toLowerCase().includes(searchValue);

      const matchesTeam =
        selectedTeam === "all" ||
        bug.team === selectedTeam;

      const matchesStatus =
        selectedStatus === "all" ||
        bug.status === selectedStatus;

      return (
        isNotFinished &&
        matchesSearch &&
        matchesTeam &&
        matchesStatus
      );
    });
  }, [bugs, search, selectedTeam, selectedStatus]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredBugs.length / ITEMS_PER_PAGE)
  );

  const paginatedBugs = filteredBugs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Export all filtered bugs to Excel
  const exportToExcel = () => {
    if (filteredBugs.length === 0) return;

    const exportData = filteredBugs.map((bug) => ({
      "מספר באג": bug.number ?? "",
      "שם הבאג": bug.name ?? "",
      "צוות": bug.team ?? "",
      "סטטוס": bug.status ?? "",
      "תאריך פתיחה": bug.openDate ?? "",
      "גיל הבאג (ימים)": calculateAge(bug.openDate),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Excel column widths
    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 35 },
      { wch: 25 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "פירוט באגים"
    );

    const today = new Date()
      .toISOString()
      .split("T")[0];

    XLSX.writeFile(
      workbook,
      `Bugs_Report_${today}.xlsx`
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setSearch("");
    setSelectedTeam("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  return (
    <section
      dir="rtl"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="border-b border-slate-100 p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              פירוט באגים פתוחים
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              חיפוש, סינון וצפייה בפרטי הבאגים פתוחים בפרויקט
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Results counter */}
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
              {filteredBugs.length.toLocaleString("he-IL")} תוצאות
            </div>

            {/* Excel export */}
            <button
              onClick={exportToExcel}
              disabled={filteredBugs.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={17} />
              ייצוא לאקסל ({filteredBugs.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={17}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="חיפוש לפי מספר באג או תיאור..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-10 pl-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Team filter */}
          <div className="relative">
            <Filter
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={selectedTeam}
              onChange={(event) => {
                setSelectedTeam(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pr-10 pl-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">כל הצוותים</option>

              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(event) => {
              setSelectedStatus(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">כל הסטטוסים</option>

            {statuses
              .filter(
                (status) =>
                  !String(status ?? "").includes("נגמר")
              )
              .map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
          </select>

          {/* Reset filters */}
          <button
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <RotateCcw size={16} />
            ניקוי מסננים
          </button>
        </div>
      </div>

      {/* Bug table */}
      <div className="max-h-[560px] overflow-x-auto overflow-y-auto overscroll-contain">
        {paginatedBugs.length > 0 ? (
          <BugTable bugs={paginatedBugs} />
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-4 text-center">
            <Search size={32} className="text-slate-300" />

            <h3 className="mt-3 font-semibold text-slate-700">
              לא נמצאו באגים
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              נסה לשנות את החיפוש או את אפשרויות הסינון.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          מציג{" "}

          <span className="font-semibold text-slate-800">
            {filteredBugs.length === 0
              ? 0
              : (currentPage - 1) * ITEMS_PER_PAGE + 1}
          </span>

          {" - "}

          <span className="font-semibold text-slate-800">
            {Math.min(
              currentPage * ITEMS_PER_PAGE,
              filteredBugs.length
            )}
          </span>

          {" מתוך "}

          <span className="font-semibold text-slate-800">
            {filteredBugs.length}
          </span>

          {" באגים"}
        </p>

        <div className="flex items-center gap-2">
          {/* Previous */}
          <button
            onClick={() =>
              setCurrentPage((page) =>
                Math.max(1, page - 1)
              )
            }
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={16} />
            הקודם
          </button>

          <span className="px-2 text-sm font-semibold text-slate-700">
            {currentPage} / {totalPages}
          </span>

          {/* Next */}
          <button
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(totalPages, page + 1)
              )
            }
            disabled={currentPage >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            הבא
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
