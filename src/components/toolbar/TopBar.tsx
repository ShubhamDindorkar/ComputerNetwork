"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTopologyStore } from "@/store/topologyStore";
import {
  fetchPreset,
  generateReport,
  validateTopology,
} from "@/lib/apiClient";
import { blankTopology } from "@/engine/presets/blank";

export function TopBar() {
  const router = useRouter();
  const topology = useTopologyStore((s) => s.topology);
  const loadTopology = useTopologyStore((s) => s.loadTopology);
  const setTopology = useTopologyStore((s) => s.setTopology);
  const mode = useTopologyStore((s) => s.mode);
  const setMode = useTopologyStore((s) => s.setMode);
  const setLastValidation = useTopologyStore((s) => s.setLastValidation);
  const setBottomTab = useTopologyStore((s) => s.setBottomTab);

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
    <header className="flex items-center gap-2 border-b border-slate-700 bg-[var(--panel)] px-3 py-2 text-sm">
      <Link href="/" className="font-semibold text-blue-400 hover:underline">
        Campus QoS
      </Link>
      <span className="text-slate-500">|</span>
      <input
        className="max-w-[220px] rounded border border-slate-600 bg-slate-900 px-2 py-1"
        value={topology.name}
        onChange={(e) =>
          setTopology({ ...topology, name: e.target.value })
        }
      />
      <button
        type="button"
        className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
        onClick={() => loadTopology(blankTopology())}
      >
        New
      </button>
      <select
        className="rounded border border-slate-600 bg-slate-900 px-2 py-1"
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
        className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
        onClick={saveAs}
      >
        Save As JSON
      </button>
      <button
        type="button"
        className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
        onClick={importJson}
      >
        Import
      </button>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-slate-400">Mode</span>
        <button
          type="button"
          className={`rounded px-2 py-1 ${mode === "realtime" ? "bg-blue-600" : "border border-slate-600"}`}
          onClick={() => setMode("realtime")}
        >
          Realtime
        </button>
        <button
          type="button"
          className={`rounded px-2 py-1 ${mode === "simulation" ? "bg-blue-600" : "border border-slate-600"}`}
          onClick={() => setMode("simulation")}
        >
          Simulation
        </button>
        <button
          type="button"
          className="rounded bg-emerald-700 px-2 py-1 hover:bg-emerald-600"
          onClick={() => void onValidate()}
        >
          Validate
        </button>
        <button
          type="button"
          className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
          onClick={() => void onReport()}
        >
          Report
        </button>
      </div>
    </header>
  );
}
