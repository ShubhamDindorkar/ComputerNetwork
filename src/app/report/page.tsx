"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ReportPage() {
  const [md, setMd] = useState("");

  useEffect(() => {
    setMd(sessionStorage.getItem("campus-report-md") ?? "# No report\n\nGenerate a report from the workspace.");
  }, []);

  const download = () => {
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Campus_Network_QoS_Report.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 print:max-w-none">
      <div className="mb-6 flex items-center gap-3 print:hidden">
        <Link href="/workspace" className="text-xs font-medium text-[var(--foreground)] underline hover:opacity-80">
          ← Return to Workspace
        </Link>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--subtle)] transition shadow-2xs"
          onClick={() => window.print()}
        >
          Print / PDF
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] px-3 py-1.5 text-xs font-medium hover:opacity-90 transition shadow-2xs"
          onClick={download}
        >
          Download .md
        </button>
      </div>
      <article className="rounded-xl border border-[var(--border)] bg-white p-8 text-xs font-mono leading-relaxed text-[var(--foreground)] whitespace-pre-wrap shadow-xs">
        {md}
      </article>
    </main>
  );
}
