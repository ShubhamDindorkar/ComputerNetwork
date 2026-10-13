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
        <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Interfaces
        </h4>
        {ports.map((p) => {
          const cfg = router.interfaces[p.id] ?? { status: "on" as const };
          return (
            <div key={p.id} className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3 space-y-1.5 shadow-2xs">
              <div className="text-xs font-semibold text-[var(--foreground)]">{p.label}</div>
              <label className="flex items-center gap-2 text-xs text-[var(--foreground)]">
                <input
                  type="checkbox"
                  className="rounded border-[var(--border)] accent-[var(--foreground)]"
                  checked={cfg.status !== "off"}
                  onChange={(e) =>
                    patchIface(p.id, { status: e.target.checked ? "on" : "off" })
                  }
                />
                Port enabled
              </label>
              <input
                className="w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
                placeholder="IP address"
                value={cfg.ip ?? ""}
                onChange={(e) => patchIface(p.id, { ip: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
                placeholder="Subnet mask"
                value={cfg.subnetMask ?? ""}
                onChange={(e) => patchIface(p.id, { subnetMask: e.target.value })}
              />
            </div>
          );
        })}
      </section>

      <section>
        <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Routing → OSPF
        </h4>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3 space-y-2 shadow-2xs">
          <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)]">
            <input
              type="checkbox"
              className="rounded border-[var(--border)] accent-[var(--foreground)]"
              checked={router.ospf.enabled}
              onChange={(e) =>
                patchRouter({
                  ospf: { ...router.ospf, enabled: e.target.checked },
                })
              }
            />
            Enable OSPF (process {router.ospf.processId})
          </label>
          <div className="space-y-1">
            {router.ospf.networks.map((n, i) => (
              <div key={i} className="text-xs font-mono text-[var(--foreground)]">
                {n.networkAddress} {n.wildcardMask} area {n.areaId}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-xs font-medium text-[var(--foreground)] underline hover:opacity-80"
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
        </div>
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
      <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        QoS Policy
      </h4>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3 space-y-2.5 shadow-2xs">
        <button
          type="button"
          className="rounded-lg border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] px-3 py-1.5 text-xs font-medium hover:opacity-90 transition shadow-2xs"
          onClick={applyCampusPreset}
        >
          Apply Campus-QoS-Policy preset
        </button>
        <ul className="space-y-1 text-xs font-mono text-[var(--foreground)]">
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
      </div>
    </section>
  );
}
