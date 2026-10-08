"use client";

import { getPortsForDevice } from "@/engine/catalog";
import { findLinkOnPort } from "@/engine/l2";
import type { Device } from "@/engine/types";
import { useTopologyStore } from "@/store/topologyStore";

export function SwitchInspector({ device }: { device: Device }) {
  const topology = useTopologyStore((s) => s.topology);
  const ports = getPortsForDevice(device);

  return (
    <div>
      <h4 className="mb-2 font-semibold text-slate-300">Ports</h4>
      <ul className="max-h-96 space-y-1 overflow-auto text-xs">
        {ports.map((p) => {
          const link = findLinkOnPort(topology, {
            deviceId: device.id,
            portId: p.id,
          });
          return (
            <li
              key={p.id}
              className="flex justify-between rounded border border-slate-800 px-2 py-1"
            >
              <span>{p.id}</span>
              <span className={link ? "text-green-400" : "text-slate-500"}>
                {link ? "connected" : "free"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
