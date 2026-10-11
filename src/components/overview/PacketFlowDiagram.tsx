"use client";

import { CornerDownRight, Network } from "lucide-react";

const steps = [
  {
    num: "01",
    title: "Host Subnet Evaluation",
    badge: "Host · Layer 3",
    badgeColor: "text-[var(--foreground)] bg-[var(--subtle)] border-[var(--border)] font-medium",
    desc: "PC-A1 (192.168.0.20) checks destination IP 192.168.1.20 against its subnet mask 255.255.255.0 using bitwise AND.",
    detail: "sameSubnet() returns false → packet cannot be delivered locally.",
  },
  {
    num: "02",
    title: "Forwarding to Default Gateway",
    badge: "Switch-A · Layer 2",
    badgeColor: "text-[var(--foreground)] bg-[var(--subtle)] border-[var(--border)] font-medium",
    desc: "PC-A1 wraps an Ethernet frame destined for the Core-Router MAC (gateway 192.168.0.1 on Gi0/0). Switch-A floods, learns, and forwards.",
    detail: "Switch-A sends frame out uplink port Gi0/1 to router Gi0/0.",
  },
  {
    num: "03",
    title: "Router Longest Prefix Match",
    badge: "Core-Router · Layer 3",
    badgeColor: "text-[var(--foreground)] bg-[var(--subtle)] border-[var(--border)] font-medium",
    desc: "Core-Router decapsulates the frame, decrements TTL, and performs a Longest Prefix Match against its routing table to select an egress interface.",
    detail: "Route 192.168.1.0/24 → egress Gi0/1 selected (prefix /24 wins).",
  },
  {
    num: "04",
    title: "Egress QoS Policy Scheduling",
    badge: "Campus-QoS-Policy",
    badgeColor: "text-[var(--foreground)] bg-[var(--subtle)] border-[var(--border)] font-medium",
    desc: "Before the IP datagram is serialised onto Gi0/1, it enters the CBWFQ scheduler. Class-maps inspect protocol and port number to assign the packet to a priority queue.",
    detail: "DHCP/DNS (P3 WFQ), Web-Traffic (P2 WFQ), Default (P1 FIFO) — 50/30/20% BW.",
  },
  {
    num: "05",
    title: "Delivery to Destination Host",
    badge: "Switch-B · Layer 2",
    badgeColor: "text-[var(--foreground)] bg-[var(--subtle)] border-[var(--border)] font-medium",
    desc: "Frame exits Gi0/1 to Switch-B Gi0/1. Switch-B inspects destination MAC and forwards directly to PC-B1 on Fa0/4.",
    detail: "PC-B1 processes the ICMP Echo Request and returns a Reply on the same path.",
  },
];

export function PacketFlowDiagram() {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-[var(--muted)]" />
          <h2 className="text-xl font-normal text-[var(--foreground)]">
            End-to-End Packet Forwarding Lifecycle
          </h2>
        </div>
        <p className="text-sm text-[var(--muted)] mt-1">
          Cross-subnet routing trace — PC-A1 (Building A) → PC-B1 (Building B) via Core-Router
        </p>
      </div>

      {/* Steps */}
      <div className="relative space-y-3">
        {/* Vertical connector line */}
        <div className="absolute left-[19px] top-8 bottom-8 w-px bg-[var(--border)]" />

        {steps.map((s) => (
          <div key={s.num} className="relative flex gap-4">
            {/* Step number circle */}
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel)] text-xs font-mono font-bold text-[var(--foreground)]">
              {s.num}
            </div>

            {/* Content */}
            <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-normal text-[var(--foreground)]">{s.title}</h3>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono ${s.badgeColor}`}>
                  {s.badge}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">{s.desc}</p>
              <div className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--subtle)] px-3 py-2 text-[11px] font-mono text-[var(--foreground)]">
                <CornerDownRight className="h-3.5 w-3.5 mt-0.5 text-[var(--muted)] shrink-0" />
                <span>{s.detail}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
