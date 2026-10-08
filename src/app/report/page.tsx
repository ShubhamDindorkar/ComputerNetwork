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
      <div className="mb-6 flex gap-3 print:hidden">
        <Link href="/workspace" className="text-blue-400 hover:underline">
          ← Workspace
        </Link>
        <button
          type="button"
          className="rounded border border-slate-600 px-3 py-1 text-sm"
          onClick={() => window.print()}
        >
          Print / PDF
        </button>
        <button
          type="button"
          className="rounded border border-slate-600 px-3 py-1 text-sm"
          onClick={download}
        >
          Download .md
        </button>
      </div>
      <article className="prose prose-invert max-w-none whitespace-pre-wrap font-sans text-sm leading-relaxed">
        {md}
      </article>
    </main>
  );
}
