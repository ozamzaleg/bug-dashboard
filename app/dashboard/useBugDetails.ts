"use client";

import { useMemo, useState } from "react";

import type { BugDetailsProps } from "./types";
import { ITEMS_PER_PAGE } from "./contants";
import { isFixed } from "./dashboard-utils";

export function useBugDetails({ bugs }: Pick<BugDetailsProps, "bugs">) {
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredBugs = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return bugs.filter((bug) => {
      const isNotFinished = !isFixed(bug.status ?? "");

      const matchesSearch =
        !searchValue ||
        bug.number?.toLowerCase().includes(searchValue) ||
        bug.name?.toLowerCase().includes(searchValue);

      const matchesTeam =
        selectedTeam === "all" || bug.team === selectedTeam;

      const matchesStatus =
        selectedStatus === "all" || bug.status === selectedStatus;

      return (
        isNotFinished &&
        matchesSearch &&
        matchesTeam &&
        matchesStatus
      );
    });
  }, [bugs, search, selectedTeam, selectedStatus]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBugs.length / ITEMS_PER_PAGE)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedBugs = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;

    return filteredBugs.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredBugs, safeCurrentPage]);

  const resetFilters = () => {
    setSearch("");
    setSelectedTeam("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  return {
    search,
    selectedTeam,
    selectedStatus,
    currentPage: safeCurrentPage,
    filteredBugs,
    paginatedBugs,
    totalPages,
    setSearch,
    setSelectedTeam,
    setSelectedStatus,
    setCurrentPage,
    resetFilters,
  };
}