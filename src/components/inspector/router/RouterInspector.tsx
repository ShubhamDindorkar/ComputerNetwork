"use client";

import type { Device } from "@/engine/types";
import { getPortsForDevice } from "@/engine/catalog";
import { useTopologyStore } from "@/store/topologyStore";

export function RouterInspector({ device }: { device: Device }) {
  const updateDevice = useTopologyStore((s) => s.updateDevice);
  const router = device.router!;
  const ports = getPortsForDevice(device);

  const patchRouter = (patch: Partial<typeof router>) => {
    updateDevice(device.id, { router: { ...router, ...patch } });
  };

  const patchIface = (portId: string, patch: Partial<(typeof router.interfaces)[string]>) => {
    patchRouter({
      interfaces: {
        ...router.interfaces,
        [portId]: { ...router.interfaces[portId], ...patch },
      },
    });
  };

  return (
    <div className="space-y-4">
      <section>
        <h4 className="mb-2 font-semibold text-slate-300">Interfaces</h4>
        {ports.map((p) => {
          const cfg = router.interfaces[p.id] ?? { status: "on" as const };
          return (
            <div key={p.id} className="mb-3 rounded border border-slate-700 p-2">
              <div className="text-xs font-medium">{p.label}</div>
              <label className="mt-1 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={cfg.status !== "off"}
                  onChange={(e) =>
                    patchIface(p.id, { status: e.target.checked ? "on" : "off" })
                  }
                />
                Port on
              </label>
              <input
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                placeholder="IP"
                value={cfg.ip ?? ""}
                onChange={(e) => patchIface(p.id, { ip: e.target.value })}
              />
              <input
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
                placeholder="Subnet mask"
                value={cfg.subnetMask ?? ""}
                onChange={(e) => patchIface(p.id, { subnetMask: e.target.value })}
              />
            </div>
          );
        })}
      </section>

      <section>
        <h4 className="mb-2 font-semibold text-slate-300">Routing → OSPF</h4>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={router.ospf.enabled}
            onChange={(e) =>
              patchRouter({
                ospf: { ...router.ospf, enabled: e.target.checked },
              })
            }
          />
          Enable OSPF (process {router.ospf.processId})
        </label>
        {router.ospf.networks.map((n, i) => (
          <div key={i} className="mt-2 text-xs text-slate-400">
            {n.networkAddress} {n.wildcardMask} area {n.areaId}
          </div>
        ))}
        <button
          type="button"
          className="mt-2 text-xs text-blue-400"
          onClick={() =>
            patchRouter({
              ospf: {
                ...router.ospf,
                networks: [
                  ...router.ospf.networks,
                  {
                    networkAddress: "192.168.0.0",
                    wildcardMask: "0.0.0.255",
                    areaId: 0,
                  },
                ],
              },
            })
          }
        >
          + Add network
        </button>
      </section>

      <QosSection device={device} />
    </div>
  );
}

function QosSection({ device }: { device: Device }) {
  const updateDevice = useTopologyStore((s) => s.updateDevice);
  const qos = device.router!.qos;

  const applyCampusPreset = () => {
    updateDevice(device.id, {
      router: {
        ...device.router!,
        qos: {
          classMaps: [
            {
              name: "DHCP-DNS",
              matchRules: [
                { protocol: "udp", port: 67 },
                { protocol: "udp", port: 68 },
                { protocol: "udp", port: 53 },
              ],
            },
            {
              name: "Web-Traffic",
              matchRules: [
                { protocol: "tcp", port: 80 },
                { protocol: "tcp", port: 443 },
              ],
            },
            { name: "Default-Traffic", matchRules: [{ protocol: "any" }] },
          ],
          policyMaps: [
            {
              name: "Campus-QoS-Policy",
              classes: [
                {
                  classMapName: "DHCP-DNS",
                  priorityLevel: 3,
                  bandwidthPercent: 50,
                },
                {
                  classMapName: "Web-Traffic",
                  priorityLevel: 2,
                  bandwidthPercent: 30,
                },
                {
                  classMapName: "Default-Traffic",
                  priorityLevel: 1,
                  bandwidthPercent: 20,
                },
              ],
            },
          ],
          servicePolicies: ["Gi0/0", "Gi0/1", "Gi0/2"].map((interfacePortId) => ({
            interfacePortId,
            direction: "out" as const,
            policyMapName: "Campus-QoS-Policy",
          })),
        },
      },
    });
  };

  return (
    <section>
      <h4 className="mb-2 font-semibold text-slate-300">QoS</h4>
      <button
        type="button"
        className="mb-2 rounded bg-slate-800 px-2 py-1 text-xs"
        onClick={applyCampusPreset}
      >
        Apply Campus-QoS-Policy preset
      </button>
      <ul className="space-y-1 text-xs text-slate-400">
        {qos.classMaps.map((c) => (
          <li key={c.name}>Class: {c.name}</li>
        ))}
        {qos.policyMaps.map((p) => (
          <li key={p.name}>
            Policy: {p.name} (
            {p.classes.map((c) => `${c.bandwidthPercent}%`).join(", ")})
          </li>
        ))}
        {qos.servicePolicies.map((sp, i) => (
          <li key={i}>
            {sp.interfacePortId} {sp.direction}: {sp.policyMapName}
          </li>
        ))}
      </ul>
    </section>
  );
}
