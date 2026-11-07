"use client";

import {
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import BugTable from "./BugTable";
import type { BugDetailsProps } from "../types";
import { ITEMS_PER_PAGE } from "../contants";
import { isFixed } from "../dashboard-utils";

import { useBugDetails } from "../useBugDetails";

export default function BugDetails({
  bugs,
  teams,
  statuses,
}: BugDetailsProps) {
  const {
    search,
    selectedTeam,
    selectedStatus,
    currentPage,
    filteredBugs,
    paginatedBugs,
    totalPages,
    setSearch,
    setSelectedTeam,
    setSelectedStatus,
    setCurrentPage,
    resetFilters,
  } = useBugDetails({ bugs });

  return (
    <section
      dir="rtl"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="border-b border-slate-100 p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            פירוט באגים פתוחים
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            חיפוש, סינון וצפייה בפרטי הבאגים הפתוחים בפרויקט
          </p>
        </div>

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
              .filter((status) => !isFixed(status))
              .map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
          </select>

          {/* Reset */}
          <button
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <RotateCcw size={16} />
            ניקוי מסננים
          </button>
        </div>

        <div className="mt-4">
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
            {filteredBugs.length.toLocaleString("he-IL")} תוצאות
          </span>
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
          <button
            onClick={() =>
              setCurrentPage((page) => Math.max(1, page - 1))
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