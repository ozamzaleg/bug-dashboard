
import * as XLSX from "xlsx";
import type { Bug } from "@/components/dashboard/types";

export type ExcelRowIssue = {
  row: number;
  number: string;
  column: string;
  value: string;
  message: string;
};

export type ExcelValidationResult = {
  validBugs: Bug[];
  issues: ExcelRowIssue[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  emptyRows: number;
  headerErrors: string[];
};

const REQUIRED_COLUMNS = [
  "מספר באג",
  "שם הבאג",
  "צוות",
  "תאריך פתיחה",
  "סטטוס",
];

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLocaleLowerCase();
}

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

function parseExcelDate(value: unknown): Date | null {
  if (value instanceof Date && isValidDate(value)) {
    return value;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (!parsed) return null;

    const date = new Date(
      parsed.y,
      parsed.m - 1,
      parsed.d
    );

    return isValidDate(date) ? date : null;
  }

  if (typeof value === "string") {
    const text = value.trim();

    if (!text) return null;

    const match = text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

    if (match) {
      const day = Number(match[1]);
      const month = Number(match[2]);
      const year = Number(match[3]);

      const date = new Date(year, month - 1, day);

      if (
        date.getDate() !== day ||
        date.getMonth() !== month - 1 ||
        date.getFullYear() !== year
      ) {
        return null;
      }

      return date;
    }

    const isoMatch = text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const month = Number(isoMatch[2]);
      const day = Number(isoMatch[3]);

      const date = new Date(year, month - 1, day);

      if (
        date.getDate() !== day ||
        date.getMonth() !== month - 1 ||
        date.getFullYear() !== year
      ) {
        return null;
      }

      return date;
    }

    // Fallback for other recognizable date formats
    const fallback = new Date(text);

    if (isValidDate(fallback)) {
      return fallback;
    }
  }

  return null;
}

export async function parseExcel(
  file: File
): Promise<ExcelValidationResult> {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("קובץ Excel אינו מכיל גיליונות.");
  }

  const worksheet = workbook.Sheets[firstSheetName];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  if (rows.length < 2) {
    throw new Error("לא נמצאו שורות נתונים בקובץ Excel.");
  }

  const headers = rows[0].map(normalizeHeader);

  const columnIndexes = REQUIRED_COLUMNS.map((column) =>
    headers.indexOf(normalizeHeader(column))
  );

  const headerErrors = REQUIRED_COLUMNS.filter(
    (_, index) => columnIndexes[index] === -1
  );

  const result: ExcelValidationResult = {
    validBugs: [],
    issues: [],
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    emptyRows: 0,
    headerErrors,
  };

  if (headerErrors.length > 0) {
    return result;
  }

  const records: {
    row: number;
    bug: Bug;
  }[] = [];

  rows.slice(1).forEach((row, index) => {
    const excelRow = index + 2;

    const values = columnIndexes.map(
      (columnIndex) => row[columnIndex]
    );

    const [numberValue, nameValue, teamValue, dateValue, statusValue] =
      values;

    const number = String(numberValue ?? "").trim();
    const name = String(nameValue ?? "").trim();
    const team = String(teamValue ?? "").trim();
    const status = String(statusValue ?? "").trim();

    const completelyEmpty = values.every(
      (value) => String(value ?? "").trim() === ""
    );

    if (completelyEmpty) {
      result.emptyRows++;
      return;
    }

    result.totalRows++;

    const rowIssues: ExcelRowIssue[] = [];

    function addIssue(
      column: string,
      value: unknown,
      message: string
    ) {
      rowIssues.push({
        row: excelRow,
        number,
        column,
        value: String(value ?? ""),
        message,
      });
    }

    if (!number) {
      addIssue("מספר באג", numberValue, "יש להזין מספר באג.");
    }

    if (!name) {
      addIssue("שם הבאג", nameValue, "יש להזין תיאור באג.");
    }

    if (!team) {
      addIssue("צוות", teamValue, "יש להזין צוות אחראי.");
    }

    const openDate = parseExcelDate(dateValue);

    if (!openDate) {
      addIssue(
        "תאריך פתיחה",
        dateValue,
        "תאריך לא תקין. יש להשתמש בפורמט DD/MM/YYYY או YYYY-MM-DD."
      );
    }

    if (!status) {
      addIssue("סטטוס", statusValue, "יש להזין סטטוס.");
    }

    if (rowIssues.length > 0) {
      result.issues.push(...rowIssues);
      return;
    }

    records.push({
      row: excelRow,
      bug: {
        number,
        name,
        team,
        openDate: openDate!,
        status,
      },
    });
  });

  // Detect duplicate bug numbers across the entire file.
  const numberGroups = new Map<
    string,
    { row: number; bug: Bug }[]
  >();

  records.forEach((record) => {
    const key = record.bug.number.toLocaleLowerCase();

    const existing = numberGroups.get(key) ?? [];

    existing.push(record);

    numberGroups.set(key, existing);
  });

  const duplicateRows = new Set<number>();

  numberGroups.forEach((group) => {
    if (group.length <= 1) return;

    group.forEach((record) => {
      duplicateRows.add(record.row);

      result.issues.push({
        row: record.row,
        number: record.bug.number,
        column: "מספר באג",
        value: record.bug.number,
        message: `מספר הבאג מופיע מספר פעמים בקובץ. שורות: ${group
          .map((item) => item.row)
          .join(", ")}.`,
      });
    });
  });

  records.forEach((record) => {
    if (!duplicateRows.has(record.row)) {
      result.validBugs.push(record.bug);
    }
  });

  result.validRows = result.validBugs.length;

  result.invalidRows = new Set(
    result.issues.map((issue) => issue.row)
  ).size;

  return result;
}
