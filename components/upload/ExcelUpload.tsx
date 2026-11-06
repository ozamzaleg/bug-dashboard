"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";
import * as XLSX from "xlsx";

import {
  FileSpreadsheet,
  Upload,
  CloudUpload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  ShieldCheck,
  CircleCheck,
} from "lucide-react";

import { Bug, isFixed } from "@/components/dashboard/types";
import { formatDate, getBugAge } from "@/lib/bug-utils";

type Props = {
  onUpload: (bugs: Bug[]) => void;
};

type FieldKey = "number" | "name" | "team" | "openDate" | "status";

type FieldDefinition = {
  key: FieldKey;
  label: string;
  description: string;
  aliases: string[];
};

type ExcelIssue = {
  row: number;
  number: string;
  column: string;
  value: string;
  message: string;
};

type ValidationResult = {
  validBugs: Bug[];
  issues: ExcelIssue[];
  totalRows: number;
  emptyRows: number;
  duplicateRows: number;
};

type ImportedWorkbook = {
  headers: string[];
  rows: unknown[][];
  sheetName: string;
};

type Mapping = Record<FieldKey, number | null>;

const PREVIEW_PAGE_SIZE = 10;

const FIELDS: FieldDefinition[] = [
  {
    key: "number",
    label: "מספר באג",
    description: "מזהה ייחודי של הבאג",
    aliases: [
      "מספר באג", "מזהה באג", "bug id", "bug number",
      "bug no", "id", "number", "מזהה", "מספר תקלה", "קוד באג",
    ],
  },
  {
    key: "name",
    label: "שם הבאג",
    description: "תיאור התקלה",
    aliases: [
      "שם הבאג", "תיאור באג", "תיאור", "שם תקלה",
      "bug name", "bug title", "title", "description", "summary",
    ],
  },
  {
    key: "team",
    label: "צוות",
    description: "הצוות האחראי",
    aliases: [
      "צוות", "צוות אחראי", "שם צוות", "team",
      "assigned team", "responsible team", "group",
    ],
  },
  {
    key: "openDate",
    label: "תאריך פתיחה",
    description: "מועד פתיחת הבאג",
    aliases: [
      "תאריך פתיחה", "תאריך יצירה", "תאריך",
      "open date", "created date", "creation date",
      "date created", "created at",
    ],
  },
  {
    key: "status",
    label: "סטטוס",
    description: "מצב הטיפול בבאג",
    aliases: [
      "סטטוס", "מצב", "מצב טיפול", "status",
      "state", "bug status", "current status",
    ],
  },
];

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s_\-./\\]+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function detectColumns(headers: string[]): Mapping {
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

function getMissingFields(mapping: Mapping): string[] {
  return FIELDS
    .filter((field) => mapping[field.key] === null)
    .map((field) => field.label);
}

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;

    const date = new Date(parsed.y, parsed.m - 1, parsed.d);
    return isValidDate(date) ? date : null;
  }

  if (typeof value !== "string") return null;

  const text = value.trim();
  if (!text) return null;

  const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);

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

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);

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

  const fallback = new Date(text);
  return isValidDate(fallback) ? fallback : null;
}

function validateRows(
  rows: unknown[][],
  mapping: Mapping
): ValidationResult {
  const result: ValidationResult = {
    validBugs: [],
    issues: [],
    totalRows: 0,
    emptyRows: 0,
    duplicateRows: 0,
  };

  const seenNumbers = new Map<string, number>();

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

    const number = String(numberValue).trim();
    const name = String(nameValue).trim();
    const team = String(teamValue).trim();
    const status = String(statusValue).trim();

    const values = [
      numberValue,
      nameValue,
      teamValue,
      dateValue,
      statusValue,
    ];

    if (values.every((value) => String(value ?? "").trim() === "")) {
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

    const normalizedNumber = number.toLocaleLowerCase();

    if (number && seenNumbers.has(normalizedNumber)) {
      const firstRow = seenNumbers.get(normalizedNumber)!;

      result.duplicateRows++;

      addIssue(
        "מספר באג",
        number,
        `באג כפול. מספר זה כבר מופיע בשורה ${firstRow}. השורה הנוכחית הוסרה מהייבוא.`
      );

      result.issues.push(...rowIssues);
      return;
    }

    if (number) {
      seenNumbers.set(normalizedNumber, excelRow);
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

    const openDate = parseDate(dateValue);

    if (!openDate) {
      addIssue(
        "תאריך פתיחה",
        dateValue,
        "תאריך לא תקין. פורמט נתמך: DD/MM/YYYY או YYYY-MM-DD."
      );
    }

    if (!status) {
      addIssue("סטטוס", statusValue, "יש להזין סטטוס.");
    }

    if (rowIssues.length > 0) {
      result.issues.push(...rowIssues);
      return;
    }

    result.validBugs.push({
      number,
      name,
      team,
      openDate: openDate!,
      status,
    });
  });

  return result;
}

export default function ExcelUpload({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const [workbook, setWorkbook] = useState<ImportedWorkbook | null>(null);
  const [report, setReport] = useState<ValidationResult | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);

  async function handleFile(file?: File) {
    if (!file) return;

    setError("");
    setWorkbook(null);
    setReport(null);
    setImportedCount(null);
    setFileName("");
    setPreviewPage(1);

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls"].includes(extension || "")) {
      setError("יש להעלות קובץ Excel מסוג XLSX או XLS.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("גודל הקובץ המקסימלי הוא 10MB.");
      return;
    }

    setLoading(true);

    try {
      const buffer = await file.arrayBuffer();

      const parsedWorkbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      const sheetName = parsedWorkbook.SheetNames[0];

      if (!sheetName) {
        throw new Error("קובץ Excel אינו מכיל גיליונות.");
      }

      const sheet = parsedWorkbook.Sheets[sheetName];

      const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
        raw: true,
      });

      if (rawRows.length < 2) {
        throw new Error("לא נמצאו שורות נתונים בקובץ.");
      }

      const headers = rawRows[0].map((value) =>
        String(value ?? "").trim()
      );

      if (headers.every((header) => !header)) {
        throw new Error("לא נמצאו כותרות בעמודה הראשונה.");
      }

      const detectedMapping = detectColumns(headers);
      const missingFields = getMissingFields(detectedMapping);

      if (missingFields.length > 0) {
        throw new Error(
          `לא הצלחנו לזהות את העמודות הבאות: ${missingFields.join(", ")}. יש לוודא ששורת הכותרות מכילה שמות ברורים עבור כל השדות הנדרשים.`
        );
      }

      const detectedIndexes = Object.values(detectedMapping);

      if (new Set(detectedIndexes).size !== FIELDS.length) {
        throw new Error(
          "זיהוי העמודות אינו חד-משמעי. לא ניתן לייבא את הקובץ בצורה בטוחה."
        );
      }

      const dataRows = rawRows.slice(1);
      const validation = validateRows(dataRows, detectedMapping);

      setWorkbook({
        headers,
        rows: dataRows,
        sheetName,
      });

      setReport(validation);
      setFileName(file.name);
      setImportedCount(null);
      setShowAllErrors(false);
      setPreviewPage(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "לא ניתן לקרוא את קובץ Excel."
      );
    } finally {
      setLoading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

    if (!loading) {
      void handleFile(event.dataTransfer.files?.[0]);
    }
  }

  function reset() {
    setWorkbook(null);
    setReport(null);
    setFileName("");
    setError("");
    setImportedCount(null);
    setShowAllErrors(false);
    setPreviewPage(1);
  }

  function importValidRows() {
    if (!report || report.validBugs.length === 0) return;

    try {
      onUpload(report.validBugs);
      setImportedCount(report.validBugs.length);
    } catch {
      setError("אירעה שגיאה בהעברת הנתונים למערכת.");
    }
  }

  function downloadErrorReport() {
    if (!report || report.issues.length === 0) return;

    const rows = report.issues.map((issue) => ({
      "שורה בקובץ": issue.row,
      "מספר באג": issue.number,
      "עמודה": issue.column,
      "ערך קיים": issue.value,
      "הסבר": issue.message,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const resultWorkbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(resultWorkbook, worksheet, "שגיאות");
    XLSX.writeFile(resultWorkbook, "דוח-שגיאות-ייבוא.xlsx");
  }

  function downloadTemplate() {
    const headers = FIELDS.map((field) => field.label);

    const examples = [
      ["BUG-1001", "תקלה במסך התחברות", "Frontend", "05/11/2026", "פתוח"],
      ["BUG-1002", "נתוני לקוח שגויים", "Backend", "04/11/2026", "בטיפול"],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...examples]);
    const resultWorkbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(resultWorkbook, worksheet, "דוח באגים");
    XLSX.writeFile(resultWorkbook, "תבנית-דוח-באגים.xlsx");
  }

  const errorsToShow = report
    ? showAllErrors
      ? report.issues
      : report.issues.slice(0, 8)
    : [];

  const rejectedRows = report
    ? new Set(report.issues.map((issue) => issue.row)).size
    : 0;

  const percent =
    report && report.totalRows > 0
      ? Math.round((report.validBugs.length / report.totalRows) * 100)
      : 0;

  // Pagination calculations

  const totalPreviewPages = report
    ? Math.ceil(report.validBugs.length / PREVIEW_PAGE_SIZE)
    : 0;

  const previewStartIndex = (previewPage - 1) * PREVIEW_PAGE_SIZE;

  const previewEndIndex = Math.min(
    previewStartIndex + PREVIEW_PAGE_SIZE,
    report?.validBugs.length ?? 0
  );

  const paginatedBugs = report
    ? report.validBugs.slice(previewStartIndex, previewEndIndex)
    : [];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10 lg:py-9"
    >
      <div className="mx-auto max-w-[1600px] space-y-7">
        {/* HEADER */}

        <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <FileSpreadsheet size={27} />
            </div>

            <div>
              <div className="mb-1 text-xs text-slate-400">
                ניהול נתונים / מרכז ייבוא
              </div>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                מרכז ייבוא נתונים
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                ייבוא קובצי Excel מכל סדר עמודות באמצעות זיהוי אוטומטי.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Download size={16} />
              תבנית לדוגמה
            </button>

            {workbook && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700"
              >
                <RefreshCw size={16} />
                קובץ חדש
              </button>
            )}
          </div>
        </header>

        {/* INTRO */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InfoCard
            icon={<FileSpreadsheet size={20} />}
            title="כל סדר עמודות"
            description="אין צורך לסדר את העמודות מראש"
          />

          <InfoCard
            icon={<CheckCircle2 size={20} />}
            title="זיהוי אוטומטי"
            description="המערכת מזהה את מיקום העמודות בעצמה"
          />

          <InfoCard
            icon={<ShieldCheck size={20} />}
            title="בדיקת תקינות"
            description="בדיקת נתונים וכפילויות לפני הייבוא"
          />
        </section>

        {/* UPLOAD */}

        {!workbook && (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-bold text-slate-900">
                  העלאת קובץ Excel
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  המערכת תזהה את כותרות העמודות ותבדוק את הנתונים והכפילויות.
                </p>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    void handleFile(event.target.files?.[0])
                  }
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !loading && inputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (
                      (event.key === "Enter" || event.key === " ") &&
                      !loading
                    ) {
                      event.preventDefault();
                      inputRef.current?.click();
                    }
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`mt-6 flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                    dragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40"
                  }`}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                    {loading ? (
                      <Loader2 size={30} className="animate-spin" />
                    ) : (
                      <CloudUpload size={30} />
                    )}
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    {loading
                      ? "קורא את הקובץ..."
                      : dragging
                        ? "שחרר את הקובץ כאן"
                        : "גרור את קובץ Excel לכאן"}
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    ניתן להעלות קובץ עם עמודות בכל סדר, כולל עמודות נוספות
                    שאינן נדרשות למערכת.
                  </p>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={(event) => {
                      event.stopPropagation();
                      inputRef.current?.click();
                    }}
                    className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Upload size={17} />
                    בחירת קובץ
                  </button>

                  <p className="mt-4 text-xs text-slate-400">
                    XLSX / XLS · עד 10MB
                  </p>
                </div>

                {error && (
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle size={19} className="shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            </div>

            <aside className="xl:col-span-4">
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-bold text-slate-900">איך זה עובד?</h2>

                <div className="mt-6 space-y-6">
                  <Step
                    number="01"
                    title="העלאת קובץ"
                    description="בחר כל דוח Excel שיש בו את הנתונים הנדרשים."
                  />

                  <Step
                    number="02"
                    title="זיהוי עמודות"
                    description="המערכת תנסה לזהות אוטומטית את השדות."
                  />

                  <Step
                    number="03"
                    title="בדיקת תקינות וכפילויות"
                    description="המערכת תזהה שגיאות ותסיר באגים כפולים באופן אוטומטי."
                  />

                  <Step
                    number="04"
                    title="ייבוא נתונים"
                    description="אשר את העברת השורות התקינות ללוח הבקרה."
                  />
                </div>
              </div>
            </aside>
          </section>
        )}

        {/* DETECTION */}

        {workbook && (
          <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={23} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    זיהוי עמודות אוטומטי הושלם
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    הקובץ {fileName} · גיליון {workbook.sheetName}
                  </p>

                  <p className="mt-1 text-sm text-emerald-700">
                    כל השדות הנדרשים זוהו. אין צורך לבחור או לסדר עמודות ידנית.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw size={16} />
                החלפת קובץ
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {FIELDS.map((field) => (
                <span
                  key={field.key}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs font-semibold text-emerald-800"
                >
                  <CheckCircle2 size={14} />
                  {field.label}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* VALIDATION RESULTS */}

        {report && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    תוצאות בדיקת התקינות
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    סיכום כל השורות לאחר התאמת העמודות והסרת כפילויות
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Stat label="סה״כ שורות" value={report.totalRows} color="blue" />
                <Stat label="שורות תקינות" value={report.validBugs.length} color="green" />
                <Stat label="שורות עם שגיאות" value={rejectedRows} color="red" />
                <Stat label="כפילויות שהוסרו" value={report.duplicateRows} color="amber" />
                <Stat label="שורות ריקות" value={report.emptyRows} color="blue" />
              </div>

              <div className="mt-7">
                <div className="mb-3 flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">
                    שיעור השורות התקינות
                  </span>

                  <span className="font-bold text-emerald-700">
                    {percent}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {report.duplicateRows > 0 && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <AlertCircle size={19} className="shrink-0 text-amber-600" />

                  <div>
                    <p className="text-sm font-bold text-amber-900">
                      נמצאו {report.duplicateRows} שורות כפולות
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      הכפילויות הוסרו אוטומטית. ההופעה הראשונה של כל מספר באג
                      נשמרה, וההופעות הנוספות לא יועברו ללוח הבקרה.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* ERRORS */}

            {report.issues.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-3 border-b border-red-100 bg-red-50/70 p-5 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-bold text-red-900">פירוט שגיאות</h2>

                    <p className="mt-1 text-xs text-red-700">
                      נמצאו {rejectedRows} שורות עם שגיאות, מתוכן{" "}
                      {report.duplicateRows} כפילויות שהוסרו אוטומטית.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={downloadErrorReport}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Download size={16} />
                    הורדת דוח שגיאות
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[750px] text-right text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-5 py-4">שורה</th>
                        <th className="px-5 py-4">מספר באג</th>
                        <th className="px-5 py-4">עמודה</th>
                        <th className="px-5 py-4">ערך</th>
                        <th className="px-5 py-4">הסבר</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {errorsToShow.map((issue, index) => (
                        <tr
                          key={`${issue.row}-${issue.column}-${index}`}
                          className="hover:bg-red-50/30"
                        >
                          <td className="px-5 py-4 font-bold">{issue.row}</td>
                          <td className="px-5 py-4">{issue.number || "—"}</td>
                          <td className="px-5 py-4">{issue.column}</td>
                          <td className="max-w-[180px] truncate px-5 py-4">
                            {issue.value || "ריק"}
                          </td>
                          <td className="px-5 py-4 text-red-700">
                            {issue.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {report.issues.length > 8 && (
                  <div className="border-t border-slate-100 p-4 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllErrors(!showAllErrors)}
                      className="text-sm font-semibold text-blue-600"
                    >
                      {showAllErrors
                        ? "הצג פחות"
                        : `הצג את כל ${report.issues.length} השגיאות`}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* VALID BUGS TABLE */}

            {report.validBugs.length > 0 && (
              <section
                dir="rtl"
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-right text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="px-5 py-4">מספר באג</th>
                        <th className="px-5 py-4">שם הבאג</th>
                        <th className="px-5 py-4">צוות</th>
                        <th className="px-5 py-4">תאריך פתיחה</th>
                        <th className="px-5 py-4">גיל הבאג (ימים)</th>
                        <th className="px-5 py-4">סטטוס</th>
                        <th className="px-5 py-4">מצב טיפול</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {paginatedBugs.map((bug, index) => {
                        const fixed = isFixed(bug.status);

                        return (
                          <tr
                            key={`${bug.number}-${previewStartIndex + index}`}
                            className="transition-colors hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              {bug.number}
                            </td>

                            <td className="px-5 py-4 text-slate-700">
                              {bug.name}
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {bug.team}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                              {formatDate(bug.openDate)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                              {getBugAge(bug.openDate)} ימים
                            </td>

                            <td className="px-5 py-4">
                              <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                {bug.status}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                  fixed
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {fixed ? "טופל" : "לא טופל"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION FOOTER */}

                <div className="flex flex-col justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center">
                  <p className="text-xs font-medium text-slate-500">
                    מציג{" "}
                    <span className="font-bold text-slate-800">
                      {previewStartIndex + 1}
                    </span>
                    {" - "}
                    <span className="font-bold text-slate-800">
                      {previewEndIndex}
                    </span>
                    {" מתוך "}
                    <span className="font-bold text-slate-800">
                      {report.validBugs.length.toLocaleString("he-IL")}
                    </span>
                    {" באגים"}
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={previewPage === 1}
                      onClick={() =>
                        setPreviewPage((page) => Math.max(1, page - 1))
                      }
                      className="text-xs font-semibold text-slate-600 transition hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      הקודם
                    </button>

                    <span className="min-w-[45px] text-center text-xs font-bold tabular-nums text-slate-700">
                      {previewPage} / {totalPreviewPages}
                    </span>

                    <button
                      type="button"
                      disabled={previewPage === totalPreviewPages}
                      onClick={() =>
                        setPreviewPage((page) =>
                          Math.min(totalPreviewPages, page + 1)
                        )
                      }
                      className="text-xs font-semibold text-slate-600 transition hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      הבא
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* IMPORT CONFIRMATION */}

            {importedCount === null && (
              <section className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-bold text-slate-900">
                    אישור העברת נתונים
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {report.validBugs.length} שורות תקינות יועברו ללוח הבקרה.
                    {" "}
                    {report.duplicateRows} כפילויות הוסרו.
                    {" "}
                    שורות עם שגיאות לא יועברו.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={report.validBugs.length === 0}
                  onClick={importValidRows}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300"
                >
                  <Upload size={18} />
                  ייבוא {report.validBugs.length} שורות
                </button>
              </section>
            )}

            {/* IMPORT RESULT */}

            {importedCount !== null && (
              <section className="rounded-2xl border border-emerald-200 bg-white p-7 shadow-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={28} className="text-emerald-600" />

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      הייבוא הושלם
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      הנתונים התקינים הועברו ללוח הבקרה.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Stat label="שורות שיובאו" value={importedCount} color="green" />
                  <Stat label="שורות שנדחו" value={rejectedRows} color="red" />
                  <Stat label="כפילויות שהוסרו" value={report.duplicateRows} color="amber" />
                  <Stat label="שורות ריקות" value={report.emptyRows} color="blue" />
                </div>

                <button
                  type="button"
                  onClick={reset}
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-700"
                >
                  <RefreshCw size={17} />
                  ייבוא קובץ נוסף
                </button>
              </section>
            )}
          </>
        )}

        {/* FOOTER */}

        <footer className="flex flex-wrap justify-center gap-5 pb-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} />
            בדיקת נתונים
          </span>
          <span>XLSX / XLS</span>
          <span>עד 10MB</span>
          <span>זיהוי עמודות אוטומטי</span>
          <span>הסרת כפילויות</span>
        </footer>
      </div>
    </main>
  );
}

/* UI COMPONENTS */

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "red" | "amber";
}) {
  const styles = {
    blue: "text-blue-700",
    green: "text-emerald-700",
    red: "text-red-700",
    amber: "text-amber-700",
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className={`mt-3 text-3xl font-bold tabular-nums ${styles[color]}`}>
        {value.toLocaleString("he-IL")}
      </p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
        {number}
      </div>

      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}