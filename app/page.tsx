
"use client";

import { useState } from "react";

import ExcelUpload from "@/components/upload/ExcelUpload";
import Dashboard from "@/components/dashboard/dashboard";
import type { Bug } from "@/components/dashboard/types";

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
