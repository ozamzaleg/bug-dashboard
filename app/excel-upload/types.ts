import type { Bug } from "@/app/dashboard/types";

export type FieldKey = "number" | "name" | "team" | "openDate" | "status";

export type FieldDefinition = {
  key: FieldKey;
  label: string;
  description: string;
  aliases: string[];
};

export type Mapping = Record<FieldKey, number | null>;

export type ExcelIssue = {
  row: number;
  number: string;
  column: string;
  value: string;
  message: string;
};

export type ValidationResult = {
  validBugs: Bug[];
  issues: ExcelIssue[];
  totalRows: number;
  emptyRows: number;
};

export type ImportedWorkbook = {
  headers: string[];
  rows: unknown[][];
  sheetName: string;
};

export type Props = {
  onUpload: (bugs: Bug[]) => void;
};
