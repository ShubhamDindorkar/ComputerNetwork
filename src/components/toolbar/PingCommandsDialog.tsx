"use client";

import { useState } from "react";
import { Copy, Check, X, Terminal, ArrowRight, Network } from "lucide-react";

interface CommandItem {
  cmd: string;
  desc: string;
  category: "PC-A1 (DHCP)" | "PC-B1 (Static)" | "Core-Router";
  tag: string;
}

const COMMANDS: CommandItem[] = [
  // PC-A1
  {
    cmd: "ping 192.168.0.10",
    desc: "Intra-LAN ping to local DHCP-Server via Switch-A (same broadcast domain)",
    category: "PC-A1 (DHCP)",
    tag: "Intra-Subnet A",
  },
  {
    cmd: "ping 192.168.0.11",
    desc: "Intra-LAN ping to local DNS-Server via Switch-A",
    category: "PC-A1 (DHCP)",
    tag: "Intra-Subnet A",
  },
  {
    cmd: "ping 192.168.0.1",
    desc: "Ping default gateway on Core-Router interface Gi0/0",
    category: "PC-A1 (DHCP)",
    tag: "Gateway L3",
  },
  {
    cmd: "ping 192.168.1.20",
    desc: "Cross-subnet ping to PC-B1 in Building B (routed via Core-Router)",
    category: "PC-A1 (DHCP)",
    tag: "Inter-Subnet B",
  },
  {
    cmd: "ping 192.168.1.21",
    desc: "Cross-subnet ping to PC-B2 in Building B",
    category: "PC-A1 (DHCP)",
    tag: "Inter-Subnet B",
  },
  {
    cmd: "ping 192.168.1.22",
    desc: "Cross-subnet ping to PC-B3 in Building B",
    category: "PC-A1 (DHCP)",
    tag: "Inter-Subnet B",
  },
  {
    cmd: "ping 192.168.2.10",
    desc: "Ping DMZ Web-Server across router interface Gi0/2",
    category: "PC-A1 (DHCP)",
    tag: "DMZ Subnet C",
  },
  {
    cmd: "tracert 192.168.1.20",
    desc: "Hop-by-hop packet route tracing from PC-A1 through Core-Router to PC-B1",
    category: "PC-A1 (DHCP)",
    tag: "Traceroute",
  },
  {
    cmd: "tracert 192.168.2.10",
    desc: "Hop-by-hop route tracing from PC-A1 to DMZ Web-Server",
    category: "PC-A1 (DHCP)",
    tag: "Traceroute",
  },
  {
    cmd: "nslookup campus.local",
    desc: "Queries DNS-Server (192.168.0.11) via UDP 53 to resolve campus.local to 192.168.2.10",
    category: "PC-A1 (DHCP)",
    tag: "DNS UDP 53",
  },
  {
    cmd: "ipconfig /all",
    desc: "Inspect current IP, subnet mask, default gateway, and DNS server lease",
    category: "PC-A1 (DHCP)",
    tag: "DHCP State",
  },
  {
    cmd: "ipconfig /renew",
    desc: "Triggers DHCP DORA cycle (Discover -> Offer -> Request -> Ack) with DHCP-Server",
    category: "PC-A1 (DHCP)",
    tag: "DORA Cycle",
  },

  // PC-B1
  {
    cmd: "ping 192.168.1.1",
    desc: "Ping default gateway on Core-Router interface Gi0/1",
    category: "PC-B1 (Static)",
    tag: "Gateway L3",
  },
  {
    cmd: "ping 192.168.0.10",
    desc: "Cross-subnet ping to Building A DHCP-Server (192.168.0.10)",
    category: "PC-B1 (Static)",
    tag: "Inter-Subnet A",
  },
  {
    cmd: "ping 192.168.0.11",
    desc: "Cross-subnet ping to Building A DNS-Server (192.168.0.11)",
    category: "PC-B1 (Static)",
    tag: "Inter-Subnet A",
  },
  {
    cmd: "ping 192.168.0.20",
    desc: "Cross-subnet ping to PC-A1 in Building A",
    category: "PC-B1 (Static)",
    tag: "Inter-Subnet A",
  },
  {
    cmd: "ping 192.168.2.10",
    desc: "Ping DMZ Web-Server from Building B engineering station",
    category: "PC-B1 (Static)",
    tag: "DMZ Subnet C",
  },
  {
    cmd: "tracert 192.168.2.10",
    desc: "Hop-by-hop packet trace across router boundary to DMZ Web-Server",
    category: "PC-B1 (Static)",
    tag: "Traceroute",
  },
  {
    cmd: "ipconfig",
    desc: "Display static IP configuration (192.168.1.20, gateway 192.168.1.1)",
    category: "PC-B1 (Static)",
    tag: "Static IP",
  },

  // Core Router
  {
    cmd: "show ip interface brief",
    desc: "Display line and IP status for Gi0/0 (Subnet A), Gi0/1 (Subnet B), and Gi0/2 (DMZ)",
    category: "Core-Router",
    tag: "Interface Status",
  },
  {
    cmd: "show ip route",
    desc: "Inspect routing table (connected routes 192.168.0.0, 192.168.1.0, 192.168.2.0)",
    category: "Core-Router",
    tag: "Routing Table",
  },
  {
    cmd: "show ip protocols",
    desc: "Verify active OSPF routing process 1 and advertised area 0 network statements",
    category: "Core-Router",
    tag: "OSPF Area 0",
  },
];

const IP_MAP = [
  { subnet: "Subnet A (LAN 1)", net: "192.168.0.0/24", host: "Core-Router Gi0/0", ip: "192.168.0.1" },
  { subnet: "Subnet A (LAN 1)", net: "192.168.0.0/24", host: "DHCP-Server", ip: "192.168.0.10" },
  { subnet: "Subnet A (LAN 1)", net: "192.168.0.0/24", host: "DNS-Server", ip: "192.168.0.11" },
  { subnet: "Subnet A (LAN 1)", net: "192.168.0.0/24", host: "PC-A1, PC-A2, PC-A3", ip: "192.168.0.20, .21, .22" },
  { subnet: "Subnet B (LAN 2)", net: "192.168.1.0/24", host: "Core-Router Gi0/1", ip: "192.168.1.1" },
  { subnet: "Subnet B (LAN 2)", net: "192.168.1.0/24", host: "PC-B1, PC-B2, PC-B3", ip: "192.168.1.20, .21, .22" },
  { subnet: "Subnet C (DMZ)",   net: "192.168.2.0/24", host: "Core-Router Gi0/2", ip: "192.168.2.1" },
  { subnet: "Subnet C (DMZ)",   net: "192.168.2.0/24", host: "Web-Server", ip: "192.168.2.10 (campus.local)" },
];

export function PingCommandsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!open) return null;

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 1800);
  };

  const filtered =
    activeTab === "All"
      ? COMMANDS
      : COMMANDS.filter((c) => c.category === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-[var(--subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white">
              <Terminal className="h-4 w-4 text-[var(--foreground)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                Network Ping &amp; Diagnostic Commands
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Systematic command reference for testing reachability and triggering simulation traces
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-white p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] transition shadow-2xs"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Instructions banner */}
        <div className="border-b border-[var(--border)] bg-white px-6 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground)]">
            <span className="font-semibold font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
              Simulation workflow:
            </span>
            <span className="flex items-center gap-1.5">
              <span className="rounded border border-[var(--border)] bg-[var(--subtle)] px-2 py-0.5 font-mono text-[11px]">1. Mode → Simulation</span>
              <ArrowRight className="h-3 w-3 text-[var(--muted)]" />
              <span className="rounded border border-[var(--border)] bg-[var(--subtle)] px-2 py-0.5 font-mono text-[11px]">2. Bottom tab → Simulation Trace</span>
              <ArrowRight className="h-3 w-3 text-[var(--muted)]" />
              <span className="rounded border border-[var(--border)] bg-[var(--subtle)] px-2 py-0.5 font-mono text-[11px]">3. Double-click PC → CLI</span>
              <ArrowRight className="h-3 w-3 text-[var(--muted)]" />
              <span className="rounded border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] px-2 py-0.5 font-mono text-[11px]">4. Run ping</span>
            </span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-6 py-2.5 bg-[var(--subtle)] text-xs">
          {["All", "PC-A1 (DHCP)", "PC-B1 (Static)", "Core-Router", "IP Map"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rounded-lg px-3 py-1 text-xs transition shadow-2xs ${
                activeTab === tab
                  ? "border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium"
                  : "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--subtle)]"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {activeTab === "IP Map" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden shadow-2xs">
                <table className="w-full text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--subtle)] text-left text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      <th className="py-2.5 px-4">Subnet</th>
                      <th className="py-2.5 px-4">Network CIDR</th>
                      <th className="py-2.5 px-4">Device Host</th>
                      <th className="py-2.5 px-4">Assigned IPv4</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {IP_MAP.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--subtle)] transition-colors">
                        <td className="py-2 px-4 text-[var(--foreground)] font-medium">{row.subnet}</td>
                        <td className="py-2 px-4 text-[var(--muted)]">{row.net}</td>
                        <td className="py-2 px-4 text-[var(--foreground)]">{row.host}</td>
                        <td className="py-2 px-4 font-semibold text-[var(--foreground)]">{row.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((item) => {
                const isCopied = copiedCmd === item.cmd;
                return (
                  <div
                    key={item.cmd}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-white p-3.5 hover:border-[var(--foreground)] transition shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-[var(--subtle)] border border-[var(--border)] px-2.5 py-1 text-xs font-mono font-semibold text-[var(--foreground)]">
                          {item.cmd}
                        </code>
                        <span className="rounded border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] font-mono text-[var(--muted)]">
                          {item.tag}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--muted)] hidden md:inline">
                          [{item.category}]
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] pl-0.5">{item.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.cmd)}
                      className={`inline-flex items-center justify-center gap-1.5 shrink-0 rounded-lg px-3 py-1.5 text-xs transition shadow-2xs font-mono ${
                        isCopied
                          ? "border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium"
                          : "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--subtle)]"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[var(--muted)]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-3.5 bg-[var(--subtle)]">
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <Network className="h-4 w-4" />
            <span>Campus Network QoS Simulator · 12-Device Multi-Subnet Architecture</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--subtle)] transition shadow-2xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
