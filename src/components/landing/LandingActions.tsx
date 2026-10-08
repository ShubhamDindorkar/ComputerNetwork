"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchPreset } from "@/lib/apiClient";
import { useTopologyStore } from "@/store/topologyStore";
import { blankTopology } from "@/engine/presets/blank";

export function LandingActions() {
  const router = useRouter();
  const loadTopology = useTopologyStore((s) => s.loadTopology);

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
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={startNew}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
      >
        New blank project
      </button>
      <button
        type="button"
        onClick={loadFull}
        className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
      >
        Load Campus_Network_QoS_Project
      </button>
      <button
        type="button"
        onClick={onImport}
        className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
      >
        Import JSON
      </button>
      <Link
        href="/workspace"
        className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
      >
        Resume last session
      </Link>
    </div>
  );
}
