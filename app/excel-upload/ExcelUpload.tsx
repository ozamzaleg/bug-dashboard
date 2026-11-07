"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import type { Props, ImportedWorkbook, ValidationResult } from "./types";
import { MAX_FILE_SIZE, FIELDS } from "./constants";
import {
  downloadExcelTemplate,
  parseExcelFile,
  validateWorkbook,
} from "./excel-utils";
import UploadSection from "./components/UploadSection";
import InfoCard from "./components/InfoCard";
import ImportSummary from "./components/ImportSummary";
import ErrorsPanel from "./components/ErrorsPanel";
import PreviewTable from "./components/PreviewTable";
import ImportActions from "./components/ImportActions";

export default function ExcelUpload({ onUpload }: Props) {
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [workbook, setWorkbook] = useState<ImportedWorkbook | null>(null);
  const [report, setReport] = useState<ValidationResult | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  async function handleFile(file?: File) {
    if (!file) return;

    setError("");
    setWorkbook(null);
    setReport(null);
    setImportedCount(null);
    setFileName("");

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls"].includes(extension || "")) {
      setError("יש להעלות קובץ Excel מסוג XLSX או XLS.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("גודל הקובץ המקסימלי הוא 10MB.");
      return;
    }

    setLoading(true);
    try {
      const parsed = parseExcelFile(await file.arrayBuffer());
      const validation = validateWorkbook(parsed);

      setWorkbook(parsed);
      setReport(validation);
      setFileName(file.name);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "לא ניתן לקרוא את קובץ Excel."
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setWorkbook(null);
    setReport(null);
    setFileName("");
    setError("");
    setImportedCount(null);
    setDragging(false);
  }

  function importValidRows() {
    if (!report || report.validBugs.length === 0) return;

    try {
      onUpload(report.validBugs);
      setImportedCount(report.validBugs.length);
      setError("");
    } catch {
      setError("אירעה שגיאה בהעברת הנתונים למערכת.");
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-[1600px] space-y-7">
        <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <FileSpreadsheet size={27} />
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-400">ניהול נתונים / מרכז ייבוא</div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">מרכז ייבוא נתונים</h1>
              <p className="mt-1 text-sm text-slate-500">
                ייבוא קובצי Excel מכל סדר עמודות באמצעות זיהוי אוטומטי.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadExcelTemplate}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Download size={16} /> תבנית לדוגמה
            </button>
            {workbook && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700"
              >
                <RefreshCw size={16} /> קובץ חדש
              </button>
            )}
          </div>
        </header>

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
            description="בדיקת נתונים לפני הייבוא"
          />
        </section>

        {!workbook && (
          <UploadSection
            loading={loading}
            dragging={dragging}
            error={error}
            onFile={handleFile}
            onDraggingChange={setDragging}
          />
        )}

        {workbook && (
          <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={23} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">זיהוי עמודות אוטומטי הושלם</h2>
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
                <RefreshCw size={16} /> החלפת קובץ
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {FIELDS.map((field) => (
                <span
                  key={field.key}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs font-semibold text-emerald-800"
                >
                  <CheckCircle2 size={14} /> {field.label}
                </span>
              ))}
            </div>
          </section>
        )}

        {report && (
          <>
            <ImportSummary report={report} />
            <ErrorsPanel report={report} />
            <PreviewTable bugs={report.validBugs} />
            <ImportActions
              report={report}
              importedCount={importedCount}
              onImport={importValidRows}
              onReset={reset}
            />
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={19} className="shrink-0" /> {error}
              </div>
            )}
          </>
        )}

        <footer className="flex flex-wrap justify-center gap-5 pb-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> בדיקת נתונים</span>
          <span>XLSX / XLS</span>
          <span>עד 10MB</span>
          <span>זיהוי עמודות אוטומטי</span>
        </footer>
      </div>
    </main>
  );
}
