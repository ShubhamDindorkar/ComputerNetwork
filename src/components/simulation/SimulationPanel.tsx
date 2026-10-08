"use client";

import { useTopologyStore } from "@/store/topologyStore";

export function SimulationPanel() {
  const simEvents = useTopologyStore((s) => s.simEvents);
  const clearSimEvents = useTopologyStore((s) => s.clearSimEvents);
  const mode = useTopologyStore((s) => s.mode);

  return (
    <div className="text-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-slate-400">
          {mode === "simulation"
            ? "Simulation mode: run ping/nslookup from a PC CLI to populate events."
            : "Switch to Simulation mode to step through packet traces."}
        </span>
        <button
          type="button"
          className="rounded border border-slate-600 px-2 py-0.5"
          onClick={clearSimEvents}
        >
          Clear
        </button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="p-1">Time</th>
            <th className="p-1">Device</th>
            <th className="p-1">Type</th>
            <th className="p-1">Action</th>
          </tr>
        </thead>
        <tbody>
          {simEvents.map((e) => (
            <tr key={e.id} className="border-t border-slate-800">
              <td className="p-1">{e.timeMs}ms</td>
              <td className="p-1">{e.atDevice}</td>
              <td className="p-1" style={{ color: e.color }}>
                {e.type}
              </td>
              <td className="p-1 text-slate-400">{e.lastDevice}</td>
            </tr>
          ))}
          {simEvents.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-slate-500">
                No simulation events yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
