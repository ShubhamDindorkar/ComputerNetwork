"use client";

import { useEffect, useState } from "react";
import { useTopologyStore } from "@/store/topologyStore";
import { runQosApi } from "@/lib/apiClient";

export function QosQueueVisualizer() {
  const topology = useTopologyStore((s) => s.topology);
  const router = topology.devices.find((d) => d.kind === "router");
  const [data, setData] = useState<{
    dhcpDnsAvgWithQos: number;
    dhcpDnsAvgFifo: number;
    classStats: Record<string, { avgMs: number; maxMs: number; count: number }>;
  } | null>(null);

  useEffect(() => {
    if (!router) return;
    void runQosApi(topology, router.id, "Gi0/0").then(setData);
  }, [topology, router]);

  if (!router) {
    return <p className="text-xs text-[var(--muted)]">Add or select a router to run QoS queue scenarios.</p>;
  }

  return (
    <div className="space-y-3.5 text-xs">
      <p className="text-xs text-[var(--muted)]">
        Egress Load Scenario: 20 HTTP, 10 default, 3 DHCP, 3 DNS packets through{" "}
        <strong className="text-[var(--foreground)] font-mono">Gi0/0 egress</strong> comparing Campus-QoS-Policy (CBWFQ) against standard FIFO.
      </p>
      {data && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3 min-w-[200px] shadow-2xs">
              <div className="text-[11px] font-mono uppercase text-[var(--muted)]">DHCP/DNS Latency (QoS)</div>
              <div className="text-2xl font-mono font-semibold text-[var(--foreground)] mt-1">
                {data.dhcpDnsAvgWithQos.toFixed(1)} ms
              </div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5">High priority priority-queue (50% BW)</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3 min-w-[200px] shadow-2xs">
              <div className="text-[11px] font-mono uppercase text-[var(--muted)]">DHCP/DNS Latency (FIFO)</div>
              <div className="text-2xl font-mono font-semibold text-[var(--foreground)] mt-1">
                {data.dhcpDnsAvgFifo.toFixed(1)} ms
              </div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5">Unprioritized head-of-line blocking</div>
            </div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3 space-y-2.5 shadow-2xs">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--muted)]">
              Per-Class Average Latency Breakdown
            </div>
            <ul className="space-y-2">
              {Object.entries(data.classStats).map(([name, st]) => (
                <li key={name} className="flex items-center gap-3">
                  <span className="w-28 font-mono text-xs font-medium text-[var(--foreground)]">{name}</span>
                  <div className="h-2 flex-1 rounded bg-[var(--border)] overflow-hidden">
                    <div
                      className="h-2 rounded bg-[var(--foreground)] transition-all"
                      style={{ width: `${Math.min(100, (st.avgMs / 60) * 100)}%` }}
                    />
                  </div>
                  <span className="w-36 text-right font-mono text-xs text-[var(--muted)]">
                    avg {st.avgMs.toFixed(0)}ms / max {st.maxMs.toFixed(0)}ms
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
