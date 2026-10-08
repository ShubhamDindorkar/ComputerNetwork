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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-lg border border-slate-600 bg-slate-900 p-4 shadow-xl">
        <h3 className="font-medium">
          Select port on {device.name}
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          {cablePending
            ? "Pick the second port to complete the cable."
            : "Pick the first port for the copper cable."}
        </p>
        <ul className="mt-3 max-h-64 space-y-1 overflow-auto">
          {ports.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full rounded border border-slate-700 px-2 py-2 text-left text-sm hover:border-blue-500"
                onClick={() => pick(p.id)}
              >
                {p.label}
              </button>
            </li>
          ))}
          {ports.length === 0 && (
            <li className="text-sm text-slate-500">No free ports</li>
          )}
        </ul>
        <button
          type="button"
          className="mt-3 text-sm text-slate-400 hover:text-white"
          onClick={() => setPortPickerDeviceId(null)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
