"use client";

import { getPortsForDevice } from "@/engine/catalog";
import { findLinkOnPort } from "@/engine/l2";
import { useTopologyStore } from "@/store/topologyStore";

export function PortPickerDialog() {
  const deviceId = useTopologyStore((s) => s.portPickerDeviceId);
  const setPortPickerDeviceId = useTopologyStore((s) => s.setPortPickerDeviceId);
  const topology = useTopologyStore((s) => s.topology);
  const cablePending = useTopologyStore((s) => s.cablePending);
  const setCablePending = useTopologyStore((s) => s.setCablePending);
  const addLink = useTopologyStore((s) => s.addLink);

  if (!deviceId) return null;
  const device = topology.devices.find((d) => d.id === deviceId);
  if (!device) return null;

  const ports = getPortsForDevice(device).filter(
    (p) => !findLinkOnPort(topology, { deviceId, portId: p.id }),
  );

  const pick = (portId: string) => {
    const ref = { deviceId, portId };
    if (!cablePending) {
      setCablePending(ref);
      setPortPickerDeviceId(null);
      return;
    }
    if (cablePending.deviceId === deviceId) {
      setPortPickerDeviceId(null);
      return;
    }
    addLink(cablePending, ref);
    setPortPickerDeviceId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-2xs p-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl">
        <h3 className="font-semibold text-sm text-[var(--foreground)]">
          Select Port on {device.name}
        </h3>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {cablePending
            ? "Pick the second port to complete the connection."
            : "Pick the source port for the copper straight cable."}
        </p>
        <ul className="mt-3.5 max-h-64 space-y-1.5 overflow-auto">
          {ports.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--subtle)] px-3 py-2 text-left text-xs font-mono font-medium text-[var(--foreground)] hover:border-[var(--foreground)] hover:bg-white transition shadow-2xs"
                onClick={() => pick(p.id)}
              >
                {p.label}
              </button>
            </li>
          ))}
          {ports.length === 0 && (
            <li className="text-xs text-[var(--muted)] p-2">No free ports available on this device.</li>
          )}
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--subtle)] transition shadow-2xs"
            onClick={() => setPortPickerDeviceId(null)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
