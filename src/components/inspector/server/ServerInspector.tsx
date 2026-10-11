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
        <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          GigabitEthernet0 Interface
        </h4>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3 space-y-2 shadow-2xs">
          <input
            className="w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
            placeholder="IP Address"
            value={server.interface.ip ?? ""}
            onChange={(e) =>
              patch({ interface: { ...server.interface, ip: e.target.value } })
            }
          />
          <input
            className="w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
            placeholder="Subnet mask"
            value={server.interface.subnetMask ?? ""}
            onChange={(e) =>
              patch({
                interface: { ...server.interface, subnetMask: e.target.value },
              })
            }
          />
          <input
            className="w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
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
        </div>
      </section>

      <section>
        <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Services → DHCP
        </h4>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3 space-y-2 shadow-2xs">
          <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)]">
            <input
              type="checkbox"
              className="rounded border-[var(--border)] accent-[var(--foreground)]"
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
            Enable DHCP Service
          </label>
          {server.services.dhcp.pools[0] && (
            <div className="mt-2 space-y-1.5 text-xs">
              <input
                className="w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
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
                className="w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
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
                className="w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
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
              className="text-xs font-medium text-[var(--foreground)] underline hover:opacity-80"
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
              + Add Pool-Building-A
            </button>
          )}
        </div>
      </section>

      <section>
        <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Services → DNS
        </h4>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3 space-y-2 shadow-2xs">
          <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)]">
            <input
              type="checkbox"
              className="rounded border-[var(--border)] accent-[var(--foreground)]"
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
            Enable DNS Service
          </label>
          {server.services.dns.records.map((r, i) => (
            <div key={i} className="flex gap-1.5 text-xs">
              <input
                className="flex-1 rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
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
                className="w-32 rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
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
            className="text-xs font-medium text-[var(--foreground)] underline hover:opacity-80"
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
            + Add DNS A-Record
          </button>
        </div>
      </section>

      <section>
        <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Services → HTTP
        </h4>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3 shadow-2xs">
          <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)]">
            <input
              type="checkbox"
              className="rounded border-[var(--border)] accent-[var(--foreground)]"
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
            Enable HTTP (TCP Port {server.services.http.port})
          </label>
        </div>
      </section>
    </div>
  );
}
