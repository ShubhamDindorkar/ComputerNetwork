"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Terminal } from "lucide-react";
import { fetchPreset } from "@/lib/apiClient";
import { useTopologyStore } from "@/store/topologyStore";
import { blankTopology } from "@/engine/presets/blank";
import { PingCommandsDialog } from "@/components/toolbar/PingCommandsDialog";

export function LandingActions() {
  const router = useRouter();
  const loadTopology = useTopologyStore((s) => s.loadTopology);
  const [showPingDialog, setShowPingDialog] = useState(false);

  const startNew = () => {
    loadTopology(blankTopology());
    router.push("/workspace");
  };

  const loadFull = async () => {
    const t = await fetchPreset("campus-qos");
    loadTopology(t);
    router.push("/workspace");
  };

  const onImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      const t = JSON.parse(text);
      loadTopology(t);
      router.push("/workspace");
    };
    input.click();
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/overview"
          className="flex items-center gap-2 rounded-lg border border-[var(--foreground)] bg-[var(--foreground)] px-4 py-2 text-sm text-[var(--background)] hover:opacity-80 transition"
        >
          <BookOpen className="h-4 w-4" />
          Project Overview &amp; CN Concepts
        </Link>
        <button
          type="button"
          onClick={startNew}
          className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--subtle)] transition"
        >
          New blank project
        </button>
        <button
          type="button"
          onClick={loadFull}
          className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--subtle)] transition"
        >
          Load Campus_Network_QoS_Project
        </button>
        <button
          type="button"
          onClick={onImport}
          className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--subtle)] transition"
        >
          Import JSON
        </button>
        <button
          type="button"
          onClick={() => setShowPingDialog(true)}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--subtle)] transition"
        >
          <Terminal className="h-4 w-4" />
          Show ping commands
        </button>
        <Link
          href="/workspace"
          className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--subtle)] transition"
        >
          Resume last session
        </Link>
      </div>

      <PingCommandsDialog open={showPingDialog} onClose={() => setShowPingDialog(false)} />
    </>
  );
}
