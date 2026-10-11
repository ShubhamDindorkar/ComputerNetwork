"use client";

import { useState } from "react";
import {
  Layers,
  Globe,
  Radio,
  Sliders,
  Network,
  Cpu,
  ChevronRight,
  Code2,
  CheckCircle2,
} from "lucide-react";

interface LayerInfo {
  layer: string;
  osiNumber: string;
  title: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  icon: typeof Globe;
  protocols: string[];
  engineFile: string;
  summary: string;
  keyConcepts: { title: string; desc: string }[];
  codeHighlight: string;
}

const LAYERS: LayerInfo[] = [
  {
    layer: "Layer 7",
    osiNumber: "Application",
    title: "Application Layer Protocols & Services",
    color: "text-purple-400",
    badgeBg: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    borderColor: "border-purple-500/30",
    icon: Globe,
    protocols: ["DHCP (UDP 67/68)", "DNS (UDP 53)", "HTTP (TCP 80)"],
    engineFile: "src/engine/dhcp.ts, dns.ts, http.ts",
    summary:
      "Simulates end-to-end network services essential for client autoconfiguration, name resolution, and web application browsing.",
    keyConcepts: [
      {
        title: "DHCP DORA State Machine",
        desc: "Models Discover -> Offer -> Request -> Acknowledge lifecycle. Allocates IP from pool 192.168.0.20-100, assigns default gateway 192.168.0.1 and DNS server 192.168.0.11.",
      },
      {
        title: "DNS Forward Lookup (A-Record)",
        desc: "Resolves domain 'campus.local' to 192.168.2.10. Client queries configured DNS server via UDP 53; falls back cleanly if unreachable.",
      },
      {
        title: "HTTP Web Server",
        desc: "Stateless HTTP GET handling over port 80 delivering HTML response payload to the integrated virtual browser client.",
      },
    ],
    codeHighlight: `// dhcp.ts: Pool allocation & lease tracking
export function assignDhcp(topology: Topology, pcId: string) {
  // Evaluates pool start/end boundaries, checks leases,
  // assigns gateway and DNS server to the client interface
}`,
  },
  {
    layer: "Layer 4",
    osiNumber: "Transport",
    title: "Transport Protocols & Port Multiplexing",
    color: "text-blue-400",
    badgeBg: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    borderColor: "border-blue-500/30",
    icon: Radio,
    protocols: ["TCP", "UDP", "ICMP (Control)"],
    engineFile: "src/engine/types.ts, forwarding.ts",
    summary:
      "Differentiates stream-oriented connections from connectionless datagrams to drive routing, classification, and service policies.",
    keyConcepts: [
      {
        title: "TCP vs UDP Demultiplexing",
        desc: "Separates connection-oriented traffic (TCP port 80 HTTP, 443 HTTPS) from latency-sensitive datagrams (UDP 53 DNS, UDP 67/68 DHCP).",
      },
      {
        title: "Transport Port Classification",
        desc: "Engine uses source and destination port numbers in simulated packet headers (SimPacket) to trigger QoS class-map matches.",
      },
    ],
    codeHighlight: `// types.ts: Simulated packet headers
export interface SimPacket {
  id: string;
  proto: "icmp" | "udp" | "tcp" | "arp" | "dhcp";
  srcPort?: number;
  dstPort?: number;
  className?: string;
}`,
  },
  {
    layer: "QoS Engine",
    osiNumber: "Traffic Policy",
    title: "Quality of Service & Congestion Queuing",
    color: "text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    borderColor: "border-amber-500/30",
    icon: Sliders,
    protocols: ["Class-Map", "Policy-Map", "CBWFQ", "Priority Queue"],
    engineFile: "src/engine/qos.ts",
    summary:
      "Prevents queue starvation and guarantees predictable latency for infrastructure protocols (DHCP/DNS) during peak network congestion.",
    keyConcepts: [
      {
        title: "Traffic Classification (Class-Maps)",
        desc: "Deep packet inspection matches UDP 67/68/53 as 'DHCP-DNS', TCP 80/443 as 'Web-Traffic', and defaults to 'Default-Traffic'.",
      },
      {
        title: "Class-Based Weighted Fair Queueing (CBWFQ)",
        desc: "Allocates 50% bandwidth to DHCP-DNS (Priority 3, WFQ), 30% to Web (Priority 2, WFQ), and 20% to Default (Priority 1, FIFO).",
      },
      {
        title: "Latency Optimization Under Load",
        desc: "Simulates burst traffic on egress interface Gi0/0 showing ~75% reduction in DNS/DHCP completion latency compared to standard FIFO.",
      },
    ],
    codeHighlight: `// qos.ts: Scheduling by class priority & bandwidth
const policy = [
  { class: "DHCP-DNS", priority: 3, bwPercent: 50, method: "WFQ" },
  { class: "Web-Traffic", priority: 2, bwPercent: 30, method: "WFQ" },
  { class: "Default-Traffic", priority: 1, bwPercent: 20, method: "FIFO" }
];`,
  },
  {
    layer: "Layer 3",
    osiNumber: "Network",
    title: "IPv4 Addressing, Subnetting & Routing",
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    borderColor: "border-emerald-500/30",
    icon: Network,
    protocols: ["IPv4 / CIDR", "Default Gateway", "OSPF (Area 0)", "ICMP Ping"],
    engineFile: "src/engine/ip.ts, routing.ts, forwarding.ts",
    summary:
      "Calculates IP network masks, manages routing tables via Longest Prefix Match, detects routing loops, and performs hop-by-hop forwarding.",
    keyConcepts: [
      {
        title: "CIDR & Subnet Calculations",
        desc: "Bitwise IPv4 math parses prefix lengths (/24), computes network IDs, and validates wildcard masks (0.0.0.255) for OSPF configuration.",
      },
      {
        title: "Default Gateway Decision Logic",
        desc: "Host evaluates sameSubnet(destIp, hostIp, mask). Local traffic routes to switch; foreign traffic routes to router gateway interface.",
      },
      {
        title: "Longest Prefix Match (LPM)",
        desc: "Router inspects destination IP against routing table entries, picking the most specific matching route to choose egress interface.",
      },
      {
        title: "OSPF Single-Area Simulation",
        desc: "Simulates OSPF Process 1 on Area 0 advertising networks 192.168.0.0/24, 192.168.1.0/24, and 192.168.2.0/24.",
      },
    ],
    codeHighlight: `// routing.ts: Longest Prefix Match implementation
export function longestPrefixMatch(routes: RouteEntry[], destIp: string) {
  const d = parseIpv4(destIp);
  for (const r of routes) {
    const mask = (0xffffffff << (32 - r.prefix)) >>> 0;
    if ((d & mask) === (parseIpv4(r.network) & mask)) {
      if (!best || r.prefix > best.prefix) best = r;
    }
  }
  return best;
}`,
  },
  {
    layer: "Layer 2",
    osiNumber: "Data Link",
    title: "Ethernet Switching & Broadcast Domains",
    color: "text-cyan-400",
    badgeBg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    borderColor: "border-cyan-500/30",
    icon: Cpu,
    protocols: ["Ethernet Framing", "Broadcast Domains", "FastEthernet / Gigabit"],
    engineFile: "src/engine/l2.ts, catalog.ts",
    summary:
      "Simulates multi-port transparent switching, collision domain isolation, broadcast domain segmentation, and cable link states.",
    keyConcepts: [
      {
        title: "Broadcast Domain Boundary (BFS)",
        desc: "Floods broadcast frames through switch ports via Breadth-First Search (BFS), strictly bounded by Layer 3 router interfaces.",
      },
      {
        title: "Port Speeds & Media Interfaces",
        desc: "Models FastEthernet (100 Mbps) for client workstations and GigabitEthernet (1000 Mbps) for server farms and core router trunks.",
      },
      {
        title: "Link State & Administrative Status",
        desc: "Copper straight-through cables only report link-up if both connected ports have administrative status set to 'on'.",
      },
    ],
    codeHighlight: `// l2.ts: BFS broadcast domain resolution
export function broadcastDomain(topology: Topology, start: PortRef) {
  // Traverses switches and connected hosts;
  // stops traversal at router boundary ports
}`,
  },
];

export function NetworkLayerStack() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const active = LAYERS[activeIdx];

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[var(--foreground)]" />
          <h2 className="text-xl font-normal text-[var(--foreground)]">
            5-Layer Architecture &amp; Protocol Stack
          </h2>
        </div>
        <p className="text-sm text-[var(--muted)] mt-1">
          How the simulator models every tier of the OSI / TCP-IP model in TypeScript
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Layer selector */}
        <div className="lg:col-span-4 flex flex-col gap-2">
          {LAYERS.map((l, idx) => {
            const Icon = l.icon;
            const isSelected = activeIdx === idx;
            return (
              <button
                key={l.layer}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`flex items-center justify-between rounded-xl p-3 text-left transition border ${
                  isSelected
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                    : "border-[var(--border)] bg-[var(--panel)] hover:bg-[var(--subtle)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg border p-2 ${isSelected ? "border-white/20 bg-white/10" : "border-[var(--border)] bg-[var(--subtle)]"}`}>
                    <Icon className={`h-4 w-4 ${isSelected ? "text-[var(--background)]" : "text-[var(--foreground)]"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${isSelected ? "text-[var(--background)]" : "text-[var(--foreground)]"}`}>
                        {l.layer}
                      </span>
                      <span className={`text-[10px] font-mono ${isSelected ? "text-white/60" : "text-[var(--muted)]"}`}>
                        {l.osiNumber}
                      </span>
                    </div>
                    <div className={`text-xs mt-0.5 line-clamp-1 ${isSelected ? "text-white/90" : "text-[var(--foreground)]"}`}>
                      {l.title}
                    </div>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 ${isSelected ? "text-white/60 translate-x-0.5" : "text-[var(--muted)]"} transition-transform`} />
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-8 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border)] pb-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                {active.layer} · {active.osiNumber}
              </span>
              <h3 className="text-base font-normal text-[var(--foreground)] mt-0.5">{active.title}</h3>
            </div>
            <code className="rounded border border-[var(--border)] bg-[var(--subtle)] px-2.5 py-1 text-[10px] text-[var(--foreground)] font-mono">
              {active.engineFile}
            </code>
          </div>

          <p className="text-sm text-[var(--muted)] leading-relaxed">{active.summary}</p>

          <div className="flex flex-wrap gap-1.5">
            {active.protocols.map((p) => (
              <span key={p} className="rounded border border-[var(--border)] bg-[var(--subtle)] px-2.5 py-0.5 text-[11px] font-mono text-[var(--foreground)] font-medium">
                {p}
              </span>
            ))}
          </div>

          <div className="space-y-2">
            {active.keyConcepts.map((c) => (
              <div key={c.title} className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--foreground)] flex-shrink-0" />
                  <span>{c.title}</span>
                </div>
                <p className="text-[var(--muted)] leading-relaxed pl-5">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3.5 overflow-x-auto">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--muted)] mb-2">
              <Code2 className="h-3 w-3" />
              Engine Implementation Sample
            </div>
            <pre className="text-xs font-mono text-[var(--foreground)] whitespace-pre">{active.codeHighlight}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
