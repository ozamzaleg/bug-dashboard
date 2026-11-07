"use client";

import { useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  AlertCircle, CloudUpload, Loader2, Upload,
} from "lucide-react";

type Props = {
  loading: boolean;
  dragging: boolean;
  error: string;
  onFile: (file?: File) => void;
  onDraggingChange: (value: boolean) => void;
};

export default function UploadSection({
  loading, dragging, error, onFile, onDraggingChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onDraggingChange(false);
    if (!loading) onFile(event.dataTransfer.files?.[0]);
  }

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="xl:col-span-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">העלאת קובץ Excel</h2>
          <p className="mt-1 text-sm text-slate-500">
            המערכת תזהה בעצמה את כותרות העמודות ותבדוק את הנתונים.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              onFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          <div
            role="button"
            tabIndex={0}
            aria-label="העלאת קובץ Excel"
            onClick={() => !loading && inputRef.current?.click()}
            onKeyDown={(event) => {
              if ((event.key === "Enter" || event.key === " ") && !loading) {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              onDraggingChange(true);
            }}
            onDragLeave={() => onDraggingChange(false)}
            onDrop={handleDrop}
            className={`mt-6 flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragging
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40"
            }`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
              {loading ? <Loader2 size={30} className="animate-spin" /> : <CloudUpload size={30} />}
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">
              {loading ? "קורא את הקובץ..." : dragging ? "שחרר את הקובץ כאן" : "גרור את קובץ Excel לכאן"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              ניתן להעלות קובץ עם עמודות בכל סדר, כולל עמודות נוספות שאינן נדרשות למערכת.
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
              <Upload size={17} /> בחירת קובץ
            </button>
            <p className="mt-4 text-xs text-slate-400">XLSX / XLS · עד 10MB</p>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={19} className="shrink-0" /> {error}
            </div>
          )}
        </div>
      </div>

      <aside className="xl:col-span-4">
        <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">איך זה עובד?</h2>
          <div className="mt-6 space-y-6">
            {[
              ["01", "העלאת קובץ", "בחר כל דוח Excel שיש בו את הנתונים הנדרשים."],
              ["02", "זיהוי עמודות", "המערכת תנסה לזהות אוטומטית את השדות."],
              ["03", "בדיקת תקינות", "המערכת תציג שורות תקינות ושגיאות שצריך לתקן."],
              ["04", "ייבוא נתונים", "אשר את העברת השורות התקינות ללוח הבקרה."],
            ].map(([number, title, description]) => (
              <div key={number} className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                  {number}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
