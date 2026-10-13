"use client";

import { useTopologyStore } from "@/store/topologyStore";
import { ChecklistPanel } from "@/components/checklist/ChecklistPanel";
import { SimulationPanel } from "@/components/simulation/SimulationPanel";
import { QosQueueVisualizer } from "@/components/simulation/QosQueueVisualizer";

export function BottomPanel() {
  const bottomTab = useTopologyStore((s) => s.bottomTab);
  const setBottomTab = useTopologyStore((s) => s.setBottomTab);

  return (
    <div className="flex h-60 flex-col border-t border-[var(--border)] bg-[var(--panel)]">
      <div className="flex gap-1.5 border-b border-[var(--border)] bg-[var(--subtle)] px-3 py-1.5 text-xs select-none">
        {(
          [
            ["simulation", "Simulation Trace"],
            ["checklist", "Validation Checklist"],
            ["qos", "QoS Queue & Latency"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-lg px-3 py-1 text-xs transition shadow-2xs ${
              bottomTab === id
                ? "border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium"
                : "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--subtle)]"
            }`}
            onClick={() => setBottomTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3.5">
        {bottomTab === "simulation" && <SimulationPanel />}
        {bottomTab === "checklist" && <ChecklistPanel />}
        {bottomTab === "qos" && <QosQueueVisualizer />}
      </div>
    </div>
  );
}
