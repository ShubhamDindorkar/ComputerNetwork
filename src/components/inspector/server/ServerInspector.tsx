"use client";

import type { Device } from "@/engine/types";
import { useTopologyStore } from "@/store/topologyStore";

export function ServerInspector({ device }: { device: Device }) {
  const updateDevice = useTopologyStore((s) => s.updateDevice);
  const server = device.server!;

  const patch = (patchServer: Partial<typeof server>) => {
    updateDevice(device.id, { server: { ...server, ...patchServer } });
  };

  return (
    <div className="space-y-4">
      <section>
        <h4 className="font-semibold text-slate-300">GigabitEthernet0</h4>
        <input
          className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
          placeholder="IP"
          value={server.interface.ip ?? ""}
          onChange={(e) =>
            patch({ interface: { ...server.interface, ip: e.target.value } })
          }
        />
        <input
          className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
          placeholder="Subnet mask"
          value={server.interface.subnetMask ?? ""}
          onChange={(e) =>
            patch({
              interface: { ...server.interface, subnetMask: e.target.value },
            })
          }
        />
        <input
          className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
          placeholder="Default gateway"
          value={server.interface.defaultGateway ?? ""}
          onChange={(e) =>
            patch({
              interface: {
                ...server.interface,
                defaultGateway: e.target.value,
              },
            })
          }
        />
      </section>

      <section>
        <h4 className="font-semibold text-slate-300">Services → DHCP</h4>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={server.services.dhcp.enabled}
            onChange={(e) =>
              patch({
                services: {
                  ...server.services,
                  dhcp: {
                    ...server.services.dhcp,
                    enabled: e.target.checked,
                  },
                },
              })
            }
          />
          Enable DHCP
        </label>
        {server.services.dhcp.pools[0] && (
          <div className="mt-2 space-y-1 text-xs">
            <input
              className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1"
              value={server.services.dhcp.pools[0].name}
              onChange={(e) => {
                const pools = [...server.services.dhcp.pools];
                pools[0] = { ...pools[0], name: e.target.value };
                patch({
                  services: {
                    ...server.services,
                    dhcp: { ...server.services.dhcp, pools },
                  },
                });
              }}
            />
            <input
              placeholder="Start IP"
              className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1"
              value={server.services.dhcp.pools[0].startIp}
              onChange={(e) => {
                const pools = [...server.services.dhcp.pools];
                pools[0] = { ...pools[0], startIp: e.target.value };
                patch({
                  services: {
                    ...server.services,
                    dhcp: { ...server.services.dhcp, pools },
                  },
                });
              }}
            />
            <input
              placeholder="End IP"
              className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1"
              value={server.services.dhcp.pools[0].endIp}
              onChange={(e) => {
                const pools = [...server.services.dhcp.pools];
                pools[0] = { ...pools[0], endIp: e.target.value };
                patch({
                  services: {
                    ...server.services,
                    dhcp: { ...server.services.dhcp, pools },
                  },
                });
              }}
            />
          </div>
        )}
        {!server.services.dhcp.pools.length && (
          <button
            type="button"
            className="mt-2 text-xs text-blue-400"
            onClick={() =>
              patch({
                services: {
                  ...server.services,
                  dhcp: {
                    enabled: true,
                    pools: [
                      {
                        name: "Pool-Building-A",
                        defaultGateway: "192.168.0.1",
                        dnsServer: "192.168.0.11",
                        startIp: "192.168.0.20",
                        endIp: "192.168.0.100",
                        subnetMask: "255.255.255.0",
                      },
                    ],
                  },
                },
              })
            }
          >
            Add Pool-Building-A
          </button>
        )}
      </section>

      <section>
        <h4 className="font-semibold text-slate-300">Services → DNS</h4>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={server.services.dns.enabled}
            onChange={(e) =>
              patch({
                services: {
                  ...server.services,
                  dns: { ...server.services.dns, enabled: e.target.checked },
                },
              })
            }
          />
          Enable DNS
        </label>
        {server.services.dns.records.map((r, i) => (
          <div key={i} className="mt-2 flex gap-1 text-xs">
            <input
              className="flex-1 rounded border border-slate-600 bg-slate-900 px-2 py-1"
              value={r.domainName}
              onChange={(e) => {
                const records = [...server.services.dns.records];
                records[i] = { ...records[i], domainName: e.target.value };
                patch({
                  services: {
                    ...server.services,
                    dns: { ...server.services.dns, records },
                  },
                });
              }}
            />
            <input
              className="w-28 rounded border border-slate-600 bg-slate-900 px-2 py-1"
              value={r.ipAddress}
              onChange={(e) => {
                const records = [...server.services.dns.records];
                records[i] = { ...records[i], ipAddress: e.target.value };
                patch({
                  services: {
                    ...server.services,
                    dns: { ...server.services.dns, records },
                  },
                });
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className="mt-2 text-xs text-blue-400"
          onClick={() =>
            patch({
              services: {
                ...server.services,
                dns: {
                  enabled: true,
                  records: [
                    ...server.services.dns.records,
                    {
                      domainName: "campus.local",
                      type: "A",
                      ipAddress: "192.168.2.10",
                    },
                  ],
                },
              },
            })
          }
        >
          + DNS record
        </button>
      </section>

      <section>
        <h4 className="font-semibold text-slate-300">Services → HTTP</h4>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={server.services.http.enabled}
            onChange={(e) =>
              patch({
                services: {
                  ...server.services,
                  http: {
                    ...server.services.http,
                    enabled: e.target.checked,
                  },
                },
              })
            }
          />
          Enable HTTP (port {server.services.http.port})
        </label>
      </section>
    </div>
  );
}
