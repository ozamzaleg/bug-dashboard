"use client";

import { useState } from "react";

import ExcelUpload from "./excel-upload/ExcelUpload";
import Dashboard from "./dashboard/dashboard";
import type { Bug } from "./dashboard/types";

export default function Home() {
  const [bugs, setBugs] = useState<Bug[]>([]);

  if (bugs.length === 0) {
    return <ExcelUpload onUpload={setBugs} />;
  }

  return (
    <Dashboard
      bugs={bugs}
      onReset={() => setBugs([])}
    />
  );
}