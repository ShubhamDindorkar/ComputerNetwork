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
    return <p className="text-xs text-slate-500">Add a router to run QoS scenarios.</p>;
  }

  return (
    <div className="space-y-3 text-xs">
      <p className="text-slate-400">
        Load scenario: 20 HTTP, 10 default, 3 DHCP, 3 DNS packets at{" "}
        <strong>Gi0/0 egress</strong> with Campus-QoS-Policy vs FIFO.
      </p>
      {data && (
        <>
          <div className="flex gap-4">
            <div className="rounded border border-slate-700 p-2">
              <div className="text-slate-500">DHCP/DNS avg (QoS)</div>
              <div className="text-lg text-green-400">
                {data.dhcpDnsAvgWithQos.toFixed(1)} ms
              </div>
            </div>
            <div className="rounded border border-slate-700 p-2">
              <div className="text-slate-500">DHCP/DNS avg (FIFO)</div>
              <div className="text-lg text-amber-400">
                {data.dhcpDnsAvgFifo.toFixed(1)} ms
              </div>
            </div>
          </div>
          <ul className="space-y-1">
            {Object.entries(data.classStats).map(([name, st]) => (
              <li key={name} className="flex items-center gap-2">
                <span className="w-32">{name}</span>
                <div className="h-2 flex-1 rounded bg-slate-800">
                  <div
                    className="h-2 rounded bg-blue-500"
                    style={{ width: `${Math.min(100, st.avgMs)}%` }}
                  />
                </div>
                <span className="text-slate-500">
                  avg {st.avgMs.toFixed(0)}ms / max {st.maxMs.toFixed(0)}ms
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
