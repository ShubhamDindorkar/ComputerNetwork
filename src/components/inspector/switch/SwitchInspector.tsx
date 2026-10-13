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
      <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        Switch Ports
      </h4>
      <ul className="max-h-96 space-y-1.5 overflow-auto text-xs">
        {ports.map((p) => {
          const link = findLinkOnPort(topology, {
            deviceId: device.id,
            portId: p.id,
          });
          return (
            <li
              key={p.id}
              className="flex justify-between items-center rounded-md border border-[var(--border)] bg-[var(--subtle)] px-2.5 py-1.5 text-xs font-mono shadow-2xs"
            >
              <span className="font-medium text-[var(--foreground)]">{p.id}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-semibold ${
                  link
                    ? "border border-[var(--border)] bg-white text-[var(--foreground)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {link ? "connected" : "idle"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
