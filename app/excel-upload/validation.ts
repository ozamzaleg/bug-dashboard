
import * as XLSX from "xlsx";

import type { Bug } from "@/app/dashboard/types";

import type {
  ExcelIssue,
  FieldKey,
  Mapping,
  ValidationResult,
} from "./types";

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

export function parseDate(value: unknown): Date | null {
  // Excel Date object
  if (value instanceof Date) {
    if (!isValidDate(value)) return null;

    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );
  }

  // Excel serial date
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

  if (typeof value !== "string") return null;

  const text = value.trim();

  if (!text) return null;

  // DD/MM/YYYY or DD.MM.YYYY
  const dmy = text.match(
    /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/
  );

  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);

    const date = new Date(year, month - 1, day);

    return (
      date.getDate() === day &&
      date.getMonth() === month - 1 &&
      date.getFullYear() === year
    )
      ? date
      : null;
  }

  // YYYY-MM-DD
  const iso = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  );

  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);

    const date = new Date(year, month - 1, day);

    return (
      date.getDate() === day &&
      date.getMonth() === month - 1 &&
      date.getFullYear() === year
    )
      ? date
      : null;
  }

  return null;
}

export function validateRows(
  rows: unknown[][],
  mapping: Mapping
): ValidationResult {
  const result: ValidationResult = {
    validBugs: [],
    issues: [],
    totalRows: 0,
    emptyRows: 0,
  };

  const records: { row: number; bug: Bug }[] = [];

  rows.forEach((row, index) => {
    const excelRow = index + 2;

    const getValue = (key: FieldKey): unknown => {
      const column = mapping[key];
      return column === null ? "" : row[column] ?? "";
    };

    const numberValue = getValue("number");
    const nameValue = getValue("name");
    const teamValue = getValue("team");
    const dateValue = getValue("openDate");
    const statusValue = getValue("status");

    const number = String(numberValue ?? "").trim();
    const name = String(nameValue ?? "").trim();
    const team = String(teamValue ?? "").trim();
    const status = String(statusValue ?? "").trim();

    const values = [
      numberValue,
      nameValue,
      teamValue,
      dateValue,
      statusValue,
    ];

    // Skip completely empty rows.
    if (
      values.every(
        (value) => String(value ?? "").trim() === ""
      )
    ) {
      result.emptyRows++;
      return;
    }

    result.totalRows++;

    const rowIssues: ExcelIssue[] = [];

    const addIssue = (
      column: string,
      value: unknown,
      message: string
    ) => {
      rowIssues.push({
        row: excelRow,
        number,
        column,
        value: String(value ?? ""),
        message,
      });
    };

    // Required fields validation.
    if (!number) {
      addIssue(
        "מספר תקלה/משימה",
        numberValue,
        "יש להזין מספר תקלה/משימה."
      );
    }

    if (!name) {
      addIssue(
        "שם תקלה/משימה",
        nameValue,
        "יש להזין שם תקלה/משימה."
      );
    }

    if (!team) {
      addIssue(
        "צוות אחראי",
        teamValue,
        "יש להזין צוות אחראי."
      );
    }

    // Date validation.
    const openDate = parseDate(dateValue);

    if (!openDate) {
      addIssue(
        "תאריך פתיחה",
        dateValue,
        "תאריך לא תקין. פורמט נתמך: DD/MM/YYYY, DD.MM.YYYY או YYYY-MM-DD."
      );
    }

    if (!status) {
      addIssue(
        "סטטוס",
        statusValue,
        "יש להזין סטטוס."
      );
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

  // Detect duplicate task / issue numbers.
  // Reject every row belonging to a duplicate group.
  const groups = new Map<string, typeof records>();

  records.forEach((record) => {
    const key = record.bug.number
      .trim()
      .toLocaleLowerCase();

    const group = groups.get(key) ?? [];

    group.push(record);
    groups.set(key, group);
  });

  const duplicateRows = new Set<number>();

  groups.forEach((group) => {
    if (group.length < 2) return;

    group.forEach((record) => {
      duplicateRows.add(record.row);

      result.issues.push({
        row: record.row,
        number: record.bug.number,
        column: "מספר תקלה/משימה",
        value: record.bug.number,
        message: `מספר התקלה/משימה מופיע בכמה שורות: ${group
          .map((item) => item.row)
          .join(", ")}.`,
      });
    });
  });

  // Return only valid, non-duplicate bugs.
  result.validBugs = records
    .filter((record) => !duplicateRows.has(record.row))
    .map((record) => record.bug);

  return result;
}
