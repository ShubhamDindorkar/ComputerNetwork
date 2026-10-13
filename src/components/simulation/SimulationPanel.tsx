"use client";

import { useTopologyStore } from "@/store/topologyStore";
import { Terminal, Trash2, Activity } from "lucide-react";

export function SimulationPanel() {
  const simEvents = useTopologyStore((s) => s.simEvents);
  const clearSimEvents = useTopologyStore((s) => s.clearSimEvents);

  return (
    <div className="text-xs flex flex-col h-full">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--foreground)]" />
          <span className="text-xs font-medium text-[var(--foreground)]">
            Hop-by-Hop Packet Trace Inspector
          </span>
          {simEvents.length > 0 && (
            <span className="rounded-full border border-[var(--border)] bg-[var(--subtle)] px-2 py-0.5 text-[10px] font-mono text-[var(--foreground)]">
              {simEvents.length} hops recorded
            </span>
          )}
        </div>
        {simEvents.length > 0 && (
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] hover:bg-[var(--subtle)] transition shadow-2xs flex items-center gap-1.5"
            onClick={clearSimEvents}
          >
            <Trash2 className="h-3 w-3" />
            Clear trace
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-[var(--border)] bg-white shadow-2xs">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)] bg-[var(--subtle)] sticky top-0 z-10">
              <th className="py-2 px-3">Time</th>
              <th className="py-2 px-3">At Device</th>
              <th className="py-2 px-3">From</th>
              <th className="py-2 px-3">Interface</th>
              <th className="py-2 px-3">Protocol / Type</th>
              <th className="py-2 px-3">Hop Action / Routing Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {simEvents.map((e) => {
              const portStr = [
                e.inPort ? `In: ${e.inPort}` : null,
                e.outPort ? `Out: ${e.outPort}` : null,
              ]
                .filter(Boolean)
                .join(" → ");

              return (
                <tr
                  key={e.id}
                  className="font-mono text-xs text-[var(--foreground)] hover:bg-[var(--subtle)] transition-colors"
                >
                  <td className="py-2 px-3 font-semibold text-[var(--foreground)] whitespace-nowrap">
                    {e.timeMs}ms
                  </td>
                  <td className="py-2 px-3 font-semibold whitespace-nowrap">
                    {e.atDevice}
                  </td>
                  <td className="py-2 px-3 text-[var(--muted)] whitespace-nowrap">
                    {e.lastDevice}
                  </td>
                  <td className="py-2 px-3 text-[11px] text-[var(--muted)] whitespace-nowrap">
                    {portStr || "—"}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className="rounded border border-[var(--border)] bg-[var(--subtle)] px-1.5 py-0.5 text-[10px] font-semibold">
                      {e.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[var(--foreground)] font-sans text-xs">
                    {e.info ?? "Forwarded packet"}
                  </td>
                </tr>
              );
            })}

            {simEvents.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-[var(--muted)]">
                    <div className="rounded-full border border-[var(--border)] bg-[var(--subtle)] p-3">
                      <Terminal className="h-5 w-5 text-[var(--foreground)]" />
                    </div>
                    <p className="text-xs font-medium text-[var(--foreground)]">
                      No simulation trace events recorded yet
                    </p>
                    <p className="max-w-md text-xs text-[var(--muted)] leading-relaxed">
                      Select <strong>PC-A1</strong> or <strong>PC-B1</strong> on the canvas, switch to the <strong>CLI</strong> tab in the right inspector, and run a network command:
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-[11px]">
                      <code className="rounded border border-[var(--border)] bg-[var(--subtle)] px-2 py-0.5 text-[var(--foreground)]">
                        ping 192.168.0.1
                      </code>
                      <code className="rounded border border-[var(--border)] bg-[var(--subtle)] px-2 py-0.5 text-[var(--foreground)]">
                        ping 192.168.1.20
                      </code>
                      <code className="rounded border border-[var(--border)] bg-[var(--subtle)] px-2 py-0.5 text-[var(--foreground)]">
                        ping 192.168.2.10
                      </code>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
