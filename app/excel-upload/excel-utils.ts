import * as XLSX from "xlsx";
import { FIELDS } from "./constants";

import type {
  FieldKey,
  Mapping,
  ImportedWorkbook,
  ValidationResult,
} from "./types";

import type { Bug } from "@/app/dashboard/types";

import {
  calculateWorkingDays,
  formatDate,
} from "@/app/dashboard/dashboard-utils";

import { validateRows } from "./validation";

export function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s_.\/\\-]+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function detectColumns(headers: string[]): Mapping {
  const mapping: Mapping = {
    number: null,
    name: null,
    team: null,
    openDate: null,
    status: null,
  };

  const usedIndexes = new Set<number>();

  for (const field of FIELDS) {
    const aliases = field.aliases.map(normalize);

    const index = headers.findIndex((header, i) => {
      if (usedIndexes.has(i)) return false;

      return aliases.includes(normalize(header));
    });

    if (index !== -1) {
      mapping[field.key] = index;
      usedIndexes.add(index);
    }
  }

  return mapping;
}

export function getMissingFields(mapping: Mapping): string[] {
  return FIELDS
    .filter((field) => mapping[field.key] === null)
    .map((field) => field.label);
}

export function parseExcelFile(buffer: ArrayBuffer): ImportedWorkbook {
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("קובץ Excel אינו מכיל גיליונות.");
  }

  const sheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  if (rawRows.length < 2) {
    throw new Error("לא נמצאו שורות נתונים בקובץ.");
  }

  const headers = (rawRows[0] ?? []).map((value) =>
    String(value ?? "").trim()
  );

  if (headers.every((header) => !header)) {
    throw new Error("לא נמצאו כותרות בקובץ.");
  }

  const mapping = detectColumns(headers);
  const missing = getMissingFields(mapping);

  if (missing.length) {
    throw new Error(
      `לא הצלחנו לזהות את העמודות הבאות: ${missing.join(", ")}. יש לוודא ששורת הכותרות מכילה שמות ברורים עבור כל השדות הנדרשים.`
    );
  }

  const indexes = Object.values(mapping);

  if (new Set(indexes).size !== Object.keys(mapping).length) {
    throw new Error(
      "זיהוי העמודות אינו חד-משמעי. לא ניתן לייבא את הקובץ בצורה בטוחה."
    );
  }

  return {
    headers,
    rows: rawRows.slice(1),
    sheetName,
  };
}

export function validateWorkbook(
  imported: ImportedWorkbook
): ValidationResult {
  const mapping = detectColumns(imported.headers);

  return validateRows(imported.rows, mapping);
}

export function downloadExcelTemplate(): void {
  const headers = [
    "מספר תקלה/משימה",
    "שם תקלה/משימה",
    "צוות אחראי",
    "תאריך פתיחה",
    "סטטוס",
  ];

  const examples = [
    ["BUG-1001", "תקלה במסך התחברות", "Frontend", "05/11/2026", "פתוח"],
    ["BUG-1002", "נתוני לקוח שגויים", "Backend", "04/11/2026", "בטיפול"],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([
    headers,
    ...examples,
  ]);

  worksheet["!cols"] = [
    { wch: 22 },
    { wch: 35 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "דוח באגים"
  );

  XLSX.writeFile(
    workbook,
    "תבנית-דוח-באגים.xlsx"
  );
}

export function downloadIssuesReport(
  issues: ValidationResult["issues"]
): void {
  const rows = issues.map((issue) => ({
    "שורה בקובץ": issue.row,
    "מספר תקלה/משימה": issue.number,
    "עמודה": issue.column,
    "ערך קיים": issue.value,
    "הסבר": issue.message,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 20 },
    { wch: 25 },
    { wch: 65 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "שגיאות"
  );

  XLSX.writeFile(
    workbook,
    "דוח-שגיאות-ייבוא.xlsx"
  );
}

export function countRejectedRows(
  issues: ValidationResult["issues"]
): number {
  return new Set(
    issues.map((issue) => issue.row)
  ).size;
}

export function fieldKeyLabel(key: FieldKey): string {
  return FIELDS.find((field) => field.key === key)?.label ?? key;
}

/**
 * Export filtered bugs to Excel.
 * Uses shared date formatting and working-day calculation.
 */
export function exportBugsToExcel(bugs: Bug[]): void {
  if (bugs.length === 0) return;

  const exportData = bugs.map((bug) => ({
    "מספר באג": bug.number ?? "",
    "שם הבאג": bug.name ?? "",
    "צוות": bug.team ?? "",
    "סטטוס": bug.status ?? "",
    "תאריך פתיחה": formatDate(bug.openDate),
    "גיל הבאג (ימי עבודה)": calculateWorkingDays(bug.openDate),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 35 },
    { wch: 25 },
    { wch: 25 },
    { wch: 18 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "פירוט באגים"
  );

  const today = new Date().toISOString().split("T")[0];

  XLSX.writeFile(
    workbook,
    `Bugs_Report_${today}.xlsx`
  );
}