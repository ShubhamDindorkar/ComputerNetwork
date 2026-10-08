"use client";

import { useTopologyStore } from "@/store/topologyStore";
import { ChecklistPanel } from "@/components/checklist/ChecklistPanel";
import { SimulationPanel } from "@/components/simulation/SimulationPanel";
import { QosQueueVisualizer } from "@/components/simulation/QosQueueVisualizer";

export function BottomPanel() {
  const bottomTab = useTopologyStore((s) => s.bottomTab);
  const setBottomTab = useTopologyStore((s) => s.setBottomTab);

  return (
    <div className="flex h-56 flex-col border-t border-slate-700 bg-[var(--panel)]">
      <div className="flex gap-1 border-b border-slate-700 px-2 py-1 text-xs">
        {(
          [
            ["simulation", "Simulation"],
            ["checklist", "Checklist"],
            ["qos", "QoS"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded px-3 py-1 ${
              bottomTab === id ? "bg-blue-600" : "hover:bg-slate-800"
            }`}
            onClick={() => setBottomTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {bottomTab === "simulation" && <SimulationPanel />}
        {bottomTab === "checklist" && <ChecklistPanel />}
        {bottomTab === "qos" && <QosQueueVisualizer />}
      </div>
    </div>
  );
}
