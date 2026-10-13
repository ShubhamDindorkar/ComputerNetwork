"use client";

import { useState } from "react";
import { Router, SwitchCamera, Server, Monitor } from "lucide-react";

interface DeviceDetail {
  id: string;
  name: string;
  type: "Router" | "Switch" | "Server" | "PC";
  model: string;
  ip?: string;
  gateway?: string;
  role: string;
  ports: string[];
}

const DEVICES: Record<string, DeviceDetail> = {
  "core-router": {
    id: "core-router", name: "Core-Router", type: "Router",
    model: "Cisco 2911 Integrated Services Router",
    ip: "Gi0/0: 192.168.0.1 · Gi0/1: 192.168.1.1 · Gi0/2: 192.168.2.1",
    role: "L3 Gateway — OSPF Process 1 (Area 0), Campus-QoS-Policy egress scheduler on all three interfaces",
    ports: ["Gi0/0 → Switch-A", "Gi0/1 → Switch-B", "Gi0/2 → Web-Server"],
  },
  "switch-a": {
    id: "switch-a", name: "Switch-A", type: "Switch",
    model: "Cisco Catalyst 2960-24TT",
    role: "Layer 2 access switch — aggregates Building A hosts, DHCP Server, and DNS Server in the 192.168.0.0/24 broadcast domain",
    ports: ["Gi0/1 (Uplink → Router)", "Fa0/2 → DHCP-Server", "Fa0/3 → DNS-Server", "Fa0/4 → PC-A1", "Fa0/5 → PC-A2", "Fa0/6 → PC-A3"],
  },
  "switch-b": {
    id: "switch-b", name: "Switch-B", type: "Switch",
    model: "Cisco Catalyst 2960-24TT",
    role: "Layer 2 access switch — aggregates Building B static workstations in the 192.168.1.0/24 broadcast domain",
    ports: ["Gi0/1 (Uplink → Router)", "Fa0/4 → PC-B1", "Fa0/5 → PC-B2", "Fa0/6 → PC-B3"],
  },
  "dhcp-server": {
    id: "dhcp-server", name: "DHCP-Server", type: "Server",
    model: "Network Appliance",
    ip: "192.168.0.10/24",
    gateway: "192.168.0.1",
    role: "Serves Pool-Building-A (192.168.0.20–100), distributes DNS server 192.168.0.11 and default gateway 192.168.0.1 via DORA",
    ports: ["Gi0 → Switch-A Fa0/2"],
  },
  "dns-server": {
    id: "dns-server", name: "DNS-Server", type: "Server",
    model: "Network Appliance",
    ip: "192.168.0.11/24",
    gateway: "192.168.0.1",
    role: "Resolves A-record campus.local → 192.168.2.10 via UDP port 53 for the entire campus",
    ports: ["Gi0 → Switch-A Fa0/3"],
  },
  "web-server": {
    id: "web-server", name: "Web-Server", type: "Server",
    model: "DMZ Application Host",
    ip: "192.168.2.10/24",
    gateway: "192.168.2.1",
    role: "Serves HTTP (TCP port 80) campus intranet content at campus.local, directly connected to router Gi0/2 (DMZ subnet)",
    ports: ["Gi0 → Router Gi0/2"],
  },
  "pc-a": {
    id: "pc-a", name: "PC-A1 / PC-A2 / PC-A3", type: "PC",
    model: "Workstations — Building A",
    ip: "DHCP: 192.168.0.20 / .21 / .22",
    gateway: "192.168.0.1",
    role: "DHCP clients performing ping, nslookup, and web browser tests across subnets",
    ports: ["Fa0 → Switch-A Fa0/4–6"],
  },
  "pc-a1": {
    id: "pc-a1", name: "PC-A1", type: "PC",
    model: "Workstation — Building A (Lab Station 1)",
    ip: "DHCP: 192.168.0.20/24 (via Pool-Building-A)",
    gateway: "192.168.0.1 (Router Gi0/0)",
    role: "DHCP host with browser & ping client testing connectivity to web server and Subnet B",
    ports: ["FastEthernet0 → Switch-A Fa0/4"],
  },
  "pc-a2": {
    id: "pc-a2", name: "PC-A2", type: "PC",
    model: "Workstation — Building A (Lab Station 2)",
    ip: "DHCP: 192.168.0.21/24 (via Pool-Building-A)",
    gateway: "192.168.0.1 (Router Gi0/0)",
    role: "DHCP host testing DNS resolution and concurrent traffic generation",
    ports: ["FastEthernet0 → Switch-A Fa0/5"],
  },
  "pc-a3": {
    id: "pc-a3", name: "PC-A3", type: "PC",
    model: "Workstation — Building A (Lab Station 3)",
    ip: "DHCP: 192.168.0.22/24 (via Pool-Building-A)",
    gateway: "192.168.0.1 (Router Gi0/0)",
    role: "DHCP client host performing end-to-end ping reachability verification",
    ports: ["FastEthernet0 → Switch-A Fa0/6"],
  },
  "pc-b": {
    id: "pc-b", name: "PC-B1 / PC-B2 / PC-B3", type: "PC",
    model: "Workstations — Building B",
    ip: "Static: 192.168.1.20 / .21 / .22",
    gateway: "192.168.1.1",
    role: "Static IP workstations verifying cross-subnet ICMP reachability and QoS delivery from Building B",
    ports: ["Fa0 → Switch-B Fa0/4–6"],
  },
  "pc-b1": {
    id: "pc-b1", name: "PC-B1", type: "PC",
    model: "Workstation — Building B (Engineering Lab)",
    ip: "Static: 192.168.1.20/24",
    gateway: "192.168.1.1 (Router Gi0/1)",
    role: "Static IP host testing cross-subnet ICMP reachability to Subnet A & DMZ",
    ports: ["FastEthernet0 → Switch-B Fa0/4"],
  },
  "pc-b2": {
    id: "pc-b2", name: "PC-B2", type: "PC",
    model: "Workstation — Building B (Engineering Lab)",
    ip: "Static: 192.168.1.21/24",
    gateway: "192.168.1.1 (Router Gi0/1)",
    role: "Static IP host testing DNS name lookup (campus.local) across router boundary",
    ports: ["FastEthernet0 → Switch-B Fa0/5"],
  },
  "pc-b3": {
    id: "pc-b3", name: "PC-B3", type: "PC",
    model: "Workstation — Building B (Engineering Lab)",
    ip: "Static: 192.168.1.22/24",
    gateway: "192.168.1.1 (Router Gi0/1)",
    role: "Static IP host generating HTTP requests under CBWFQ QoS congestion",
    ports: ["FastEthernet0 → Switch-B Fa0/6"],
  },
};

const TypeIcon = ({ type, cls }: { type: DeviceDetail["type"]; cls?: string }) => {
  const c = cls ?? "h-4 w-4";
  if (type === "Router") return <Router className={c} />;
  if (type === "Switch") return <SwitchCamera className={c} />;
  if (type === "Server") return <Server className={c} />;
  return <Monitor className={c} />;
};

export function InteractiveTopologyDiagram() {
  const [selectedId, setSelectedId] = useState<string>("core-router");
  const selected = DEVICES[selectedId] ?? DEVICES["core-router"];

  const nodeBtn = (id: string, label: string, sub: string, x: number, y: number, w = 130, h = 48) => {
    const isSelected = selectedId === id;
    return (
      <g
        key={id}
        className="cursor-pointer"
        onClick={() => setSelectedId(id)}
        style={{ transition: "opacity 0.15s" }}
      >
        <rect
          x={x} y={y} width={w} height={h} rx={8}
          fill={isSelected ? "#1a1a18" : "#ffffff"}
          stroke={isSelected ? "#1a1a18" : "#d4d1c9"}
          strokeWidth={isSelected ? 2 : 1}
        />
        <text x={x + w / 2} y={y + h / 2 - 4} textAnchor="middle" fontSize={12}
          fontWeight="500" fill={isSelected ? "#f8f7f4" : "#1a1a18"} fontFamily="inherit">
          {label}
        </text>
        <text x={x + w / 2} y={y + h / 2 + 11} textAnchor="middle" fontSize={9.5}
          fill={isSelected ? "#b0b0a8" : "#6b7280"} fontFamily="inherit">
          {sub}
        </text>
      </g>
    );
  };

  const cable = (x1: number, y1: number, x2: number, y2: number, col = "#c4c1ba") => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={1.5} strokeDasharray="5 3" />
  );

  return (
    <div className="space-y-4">
      {/* Section heading */}
      <div className="border-b border-[var(--border)] pb-4">
        <h2 className="text-xl font-normal text-[var(--foreground)]">Campus Network Topology</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          12-device, 3-subnet architecture · Click any node to inspect its configuration
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs font-mono">
        {[
          { color: "#404040", label: "Subnet A  192.168.0.0/24 (LAN 1)" },
          { color: "#525252", label: "Subnet B  192.168.1.0/24 (LAN 2)" },
          { color: "#737373", label: "Subnet C  192.168.2.0/24 (DMZ)" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-[var(--muted)]">
            <span className="inline-block h-2 w-5 rounded-sm" style={{ background: l.color, opacity: 0.7 }} />
            {l.label}
          </span>
        ))}
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--subtle)] p-4">
        <svg viewBox="0 0 920 460" className="w-full min-w-[700px] h-auto select-none">
          <defs>
            <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.9" fill="#c4c1ba" />
            </pattern>
          </defs>
          <rect width="920" height="460" fill="url(#dots)" />

          {/* Subnet regions - clean neutral borders */}
          <rect x="22" y="130" width="355" height="315" rx="14"
            fill="#1a1a18" fillOpacity="0.02" stroke="#1a1a18" strokeOpacity="0.2" strokeWidth="1.2" strokeDasharray="5 4" />
          <text x="36" y="152" fontSize="11" fontWeight="600" fill="#1a1a18" fontFamily="inherit">
            Subnet A — 192.168.0.0/24
          </text>

          <rect x="394" y="130" width="302" height="315" rx="14"
            fill="#1a1a18" fillOpacity="0.02" stroke="#1a1a18" strokeOpacity="0.2" strokeWidth="1.2" strokeDasharray="5 4" />
          <text x="408" y="152" fontSize="11" fontWeight="600" fill="#1a1a18" fontFamily="inherit">
            Subnet B — 192.168.1.0/24
          </text>

          <rect x="713" y="130" width="190" height="315" rx="14"
            fill="#1a1a18" fillOpacity="0.02" stroke="#1a1a18" strokeOpacity="0.2" strokeWidth="1.2" strokeDasharray="5 4" />
          <text x="727" y="152" fontSize="11" fontWeight="600" fill="#1a1a18" fontFamily="inherit">
            Subnet C — DMZ
          </text>

          {/* Cables */}
          {cable(460, 65, 199, 188)}
          {cable(460, 65, 545, 188)}
          {cable(460, 65, 808, 228)}
          {cable(199, 240, 82, 258)}
          {cable(199, 240, 205, 258)}
          {cable(199, 240, 82, 355)}
          {cable(199, 240, 199, 355)}
          {cable(199, 240, 316, 355)}
          {cable(545, 240, 448, 355)}
          {cable(545, 240, 545, 355)}
          {cable(545, 240, 642, 355)}

          {/* Port labels on cables */}
          <text x="310" y="111" fontSize="9" fill="#6b7280" fontFamily="monospace">Gi0/0 ↔ Gi0/1</text>
          <text x="490" y="106" fontSize="9" fill="#6b7280" fontFamily="monospace">Gi0/1 ↔ Gi0/1</text>
          <text x="620" y="115" fontSize="9" fill="#6b7280" fontFamily="monospace">Gi0/2 ↔ Gi0</text>

          {/* Core Router */}
          {nodeBtn("core-router", "Core-Router", "Cisco 2911", 395, 20, 130, 52)}

          {/* Switches */}
          {nodeBtn("switch-a", "Switch-A", "Catalyst 2960", 134, 188, 130, 52)}
          {nodeBtn("switch-b", "Switch-B", "Catalyst 2960", 480, 188, 130, 52)}

          {/* Servers */}
          {nodeBtn("dhcp-server", "DHCP-Server", "192.168.0.10", 32, 248, 100, 44)}
          {nodeBtn("dns-server", "DNS-Server", "192.168.0.11", 155, 248, 100, 44)}
          {nodeBtn("web-server", "Web-Server", "192.168.2.10", 748, 218, 120, 52)}

          {/* PCs — Building A (unique IDs and keys) */}
          {nodeBtn("pc-a1", "PC-A1", "DHCP .20", 47, 350, 70, 42)}
          {nodeBtn("pc-a2", "PC-A2", "DHCP .21", 164, 350, 70, 42)}
          {nodeBtn("pc-a3", "PC-A3", "DHCP .22", 281, 350, 70, 42)}

          {/* PCs — Building B (unique IDs and keys) */}
          {nodeBtn("pc-b1", "PC-B1", "Static .20", 413, 350, 70, 42)}
          {nodeBtn("pc-b2", "PC-B2", "Static .21", 510, 350, 70, 42)}
          {nodeBtn("pc-b3", "PC-B3", "Static .22", 607, 350, 70, 42)}
        </svg>
      </div>

      {/* Inspector Panel */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-2 text-[var(--muted)]">
              <TypeIcon type={selected.type} cls="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-normal text-[var(--foreground)]">{selected.name}</h3>
                <code className="rounded border border-[var(--border)] bg-[var(--subtle)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
                  {selected.model}
                </code>
              </div>
              <p className="text-sm text-[var(--muted)] leading-relaxed max-w-xl">{selected.role}</p>
            </div>
          </div>

          <div className="shrink-0 space-y-1 text-right sm:text-left">
            {selected.ip && (
              <code className="block text-xs text-[var(--muted)]">
                <span className="text-[var(--foreground)]">IP:</span> {selected.ip}
              </code>
            )}
            {selected.gateway && (
              <code className="block text-xs text-[var(--muted)]">
                <span className="text-[var(--foreground)]">GW:</span> {selected.gateway}
              </code>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-3">
          <span className="text-[11px] font-mono text-[var(--muted)] mr-1">Ports:</span>
          {selected.ports.map((p) => (
            <code
              key={p}
              className="rounded border border-[var(--border)] bg-[var(--subtle)] px-2 py-0.5 text-[11px] text-[var(--foreground)]"
            >
              {p}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}
