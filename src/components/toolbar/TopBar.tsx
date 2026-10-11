"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Terminal } from "lucide-react";
import { useTopologyStore } from "@/store/topologyStore";
import {
  fetchPreset,
  generateReport,
  validateTopology,
} from "@/lib/apiClient";
import { blankTopology } from "@/engine/presets/blank";
import { PingCommandsDialog } from "./PingCommandsDialog";

export function TopBar() {
  const router = useRouter();
  const topology = useTopologyStore((s) => s.topology);
  const loadTopology = useTopologyStore((s) => s.loadTopology);
  const setTopology = useTopologyStore((s) => s.setTopology);
  const mode = useTopologyStore((s) => s.mode);
  const setMode = useTopologyStore((s) => s.setMode);
  const setLastValidation = useTopologyStore((s) => s.setLastValidation);
  const setBottomTab = useTopologyStore((s) => s.setBottomTab);
  const [showPingDialog, setShowPingDialog] = useState(false);

  const saveAs = () => {
    const blob = new Blob([JSON.stringify(topology, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topology.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      loadTopology(JSON.parse(await f.text()));
    };
    input.click();
  };

  const loadPreset = async (id: string) => {
    if (id === "blank") {
      loadTopology(blankTopology());
      return;
    }
    loadTopology(await fetchPreset(id));
  };

  const onValidate = async () => {
    const v = await validateTopology(topology);
    setLastValidation(v);
    setBottomTab("checklist");
  };

  const onReport = async () => {
    const v = await validateTopology(topology);
    setLastValidation(v);
    const { markdown } = await generateReport(topology, v);
    sessionStorage.setItem("campus-report-md", markdown);
    router.push("/report");
  };

  return (
    <>
      <header className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm select-none">
        <Link href="/" className="font-semibold text-[var(--foreground)] tracking-tight hover:opacity-80">
          Campus QoS
        </Link>
        <Link
          href="/overview"
          className="rounded-md border border-[var(--border)] bg-[var(--subtle)] px-2 py-0.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white transition"
        >
          Overview
        </Link>
        <span className="text-[var(--border)]">|</span>
        <input
          className="max-w-[220px] rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs"
          value={topology.name}
          onChange={(e) =>
            setTopology({ ...topology, name: e.target.value })
          }
        />
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] hover:bg-[var(--subtle)] transition shadow-2xs"
          onClick={() => loadTopology(blankTopology())}
        >
          New
        </button>
        <select
          className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) void loadPreset(e.target.value);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            Load preset
          </option>
          <option value="blank">Blank</option>
          <option value="campus-cabled">Cabled only</option>
          <option value="campus-qos">Full QoS project</option>
        </select>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] hover:bg-[var(--subtle)] transition shadow-2xs"
          onClick={saveAs}
        >
          Save JSON
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] hover:bg-[var(--subtle)] transition shadow-2xs"
          onClick={importJson}
        >
          Import
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] hover:bg-[var(--subtle)] transition shadow-2xs flex items-center gap-1.5"
          onClick={() => setShowPingDialog(true)}
        >
          <Terminal className="h-3.5 w-3.5" />
          Show ping commands
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[var(--muted)] font-mono">Mode</span>
          <button
            type="button"
            className={`rounded-lg px-2.5 py-1 text-xs transition shadow-2xs ${
              mode === "realtime"
                ? "border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium"
                : "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--subtle)]"
            }`}
            onClick={() => setMode("realtime")}
          >
            Realtime
          </button>
          <button
            type="button"
            className={`rounded-lg px-2.5 py-1 text-xs transition shadow-2xs ${
              mode === "simulation"
                ? "border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium"
                : "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--subtle)]"
            }`}
            onClick={() => {
              setMode("simulation");
              setBottomTab("simulation");
            }}
          >
            Simulation
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] px-3 py-1 text-xs font-medium hover:opacity-90 transition shadow-2xs"
            onClick={() => void onValidate()}
          >
            Validate
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] hover:bg-[var(--subtle)] transition shadow-2xs"
            onClick={() => void onReport()}
          >
            Report
          </button>
        </div>
      </header>

      <PingCommandsDialog open={showPingDialog} onClose={() => setShowPingDialog(false)} />
    </>
  );
}
