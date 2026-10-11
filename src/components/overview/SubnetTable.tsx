"use client";

import { Network } from "lucide-react";

const SUBNETS = [
  {
    label: "Subnet A",
    name: "Building A LAN & Infrastructure",
    networkId: "192.168.0.0",
    cidr: "/24",
    mask: "255.255.255.0",
    wildcard: "0.0.0.255",
    gateway: "192.168.0.1 (Gi0/0)",
    hosts: "DHCP-Server (.10), DNS-Server (.11), PC-A1 (.20), PC-A2 (.21), PC-A3 (.22)",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    label: "Subnet B",
    name: "Building B Workstations",
    networkId: "192.168.1.0",
    cidr: "/24",
    mask: "255.255.255.0",
    wildcard: "0.0.0.255",
    gateway: "192.168.1.1 (Gi0/1)",
    hosts: "PC-B1 (Static .20), PC-B2 (Static .21), PC-B3 (Static .22)",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    label: "Subnet C",
    name: "DMZ — Campus Web Farm",
    networkId: "192.168.2.0",
    cidr: "/24",
    mask: "255.255.255.0",
    wildcard: "0.0.0.255",
    gateway: "192.168.2.1 (Gi0/2)",
    hosts: "Web-Server (HTTP :80) — campus.local → 192.168.2.10",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
  },
];

export function SubnetTable() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-[var(--muted)]" />
          <h2 className="text-xl font-normal text-[var(--foreground)]">
            IPv4 Addressing &amp; Subnet Allocation
          </h2>
        </div>
        <p className="text-sm text-[var(--muted)] mt-1">
          Campus IP plan matching the Cisco Packet Tracer reference lab guide
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--panel)]">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)] text-xs font-mono">
              <th className="text-left px-4 py-3 font-medium">Subnet</th>
              <th className="text-left px-4 py-3 font-medium">Network / CIDR</th>
              <th className="text-left px-4 py-3 font-medium">Subnet Mask</th>
              <th className="text-left px-4 py-3 font-medium">Wildcard Mask</th>
              <th className="text-left px-4 py-3 font-medium">Default Gateway</th>
              <th className="text-left px-4 py-3 font-medium">Assigned Hosts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {SUBNETS.map((s) => (
              <tr key={s.label} className="hover:bg-[var(--subtle)] transition-colors">
                <td className="px-4 py-3.5 align-top">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-block w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-semibold ${s.badge}`}>
                      {s.label}
                    </span>
                    <span className="text-xs text-[var(--muted)]">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top font-mono text-xs">
                  <span className="text-[var(--foreground)] font-semibold">{s.networkId}</span>
                  <span className="text-[var(--muted)]">{s.cidr}</span>
                </td>
                <td className="px-4 py-3.5 align-top font-mono text-xs text-[var(--muted)]">{s.mask}</td>
                <td className="px-4 py-3.5 align-top font-mono text-xs text-[var(--muted)]">{s.wildcard}</td>
                <td className="px-4 py-3.5 align-top font-mono text-xs text-[var(--foreground)]">{s.gateway}</td>
                <td className="px-4 py-3.5 align-top text-xs text-[var(--muted)] leading-relaxed max-w-xs">{s.hosts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
