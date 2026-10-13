"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Cpu, Sparkles } from "lucide-react";
import { InteractiveTopologyDiagram } from "@/components/overview/InteractiveTopologyDiagram";
import { NetworkLayerStack } from "@/components/overview/NetworkLayerStack";
import { QosComparisonVisualizer } from "@/components/overview/QosComparisonVisualizer";
import { PacketFlowDiagram } from "@/components/overview/PacketFlowDiagram";
import { SubnetTable } from "@/components/overview/SubnetTable";
import { CliShowcase } from "@/components/overview/CliShowcase";
import { fetchPreset } from "@/lib/apiClient";
import { useTopologyStore } from "@/store/topologyStore";

const NAV_LINKS = [
  { href: "#topology", label: "Topology" },
  { href: "#layers", label: "Protocol Stack" },
  { href: "#qos", label: "QoS Simulation" },
  { href: "#packet-flow", label: "Packet Flow" },
  { href: "#subnets", label: "Addressing" },
  { href: "#cli", label: "CLI" },
  { href: "#engine", label: "Engine" },
];

const ENGINE_MODULES = [
  {
    file: "l2.ts",
    color: "text-blue-700",
    desc: "L2 switching graph, BFS broadcast domain calculation, link state evaluation bounded by router interfaces.",
  },
  {
    file: "ip.ts",
    color: "text-emerald-700",
    desc: "IPv4 bitwise arithmetic, CIDR prefix conversion, subnet mask validation, same-subnet boundary checks.",
  },
  {
    file: "routing.ts",
    color: "text-violet-700",
    desc: "Directly connected route resolution, routing table construction, Longest Prefix Match (LPM) lookup.",
  },
  {
    file: "qos.ts",
    color: "text-amber-700",
    desc: "DPI traffic classification, CBWFQ scheduling with priority queues, FIFO comparison simulation.",
  },
  {
    file: "dhcp.ts",
    color: "text-rose-700",
    desc: "DHCP DORA state machine, dynamic IP pool allocation, lease management, gateway & DNS assignment.",
  },
  {
    file: "dns.ts & http.ts",
    color: "text-teal-700",
    desc: "DNS A-record forward resolution for campus.local and stateless HTTP GET server delivering HTML to the virtual browser.",
  },
  {
    file: "forwarding.ts",
    color: "text-orange-700",
    desc: "Hop-by-hop packet forwarding, TTL decrement, routing loop detection, ICMP Echo Request/Reply traces.",
  },
  {
    file: "validate.ts",
    color: "text-indigo-700",
    desc: "Automated lab grading: device verification, port wiring tests, functional ping/DNS/HTTP reachability checks.",
  },
];

const STATS = [
  { label: "Total Devices", value: "12 Nodes", sub: "Router, Switches, PCs, Servers" },
  { label: "Subnets", value: "3 × /24", sub: "Class C partitions" },
  { label: "Cabled Links", value: "11 Cables", sub: "Copper Straight-Through" },
  { label: "QoS Latency Gain", value: "~75.7%", sub: "DNS/DHCP under burst" },
  { label: "State & Persistence", value: "Local-First", sub: "JSON Export / localStorage" },
];

export default function OverviewPage() {
  const router = useRouter();
  const loadTopology = useTopologyStore((s) => s.loadTopology);

  const loadReferenceAndLaunch = async () => {
    const t = await fetchPreset("campus-qos");
    loadTopology(t);
    router.push("/workspace");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm px-4 sm:px-8 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-[var(--foreground)] font-normal">
              Project Overview
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadReferenceAndLaunch}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3.5 py-1.5 text-xs font-mono text-[var(--foreground)] hover:bg-[var(--subtle)] transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Load Reference Topology</span>
            </button>
            <Link
              href="/workspace"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--foreground)] bg-[var(--foreground)] px-3.5 py-1.5 text-xs text-[var(--background)] hover:opacity-80 transition"
            >
              <span>Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-12 space-y-16">
        {/* Hero */}
        <div className="max-w-4xl space-y-6 border-b border-[var(--border)] pb-12">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--muted)]">
            Interactive Virtual Lab Guide · Technical Deep Dive
          </p>
          <h1 className="text-4xl sm:text-5xl font-normal leading-[1.1] text-[var(--foreground)]">
            Campus Network with{" "}
            <span className="italic">Quality of Service</span>
          </h1>
          <p className="text-base text-[var(--muted)] leading-relaxed max-w-3xl">
            A browser-based, zero-database network emulator modelled on a Cisco Packet Tracer enterprise
            campus design. Features a complete <strong className="text-[var(--foreground)] font-normal">12-device topology</strong> across three IPv4 subnets,
            simulating Layer 2 switching, Layer 3 routing (OSPF), DHCP, DNS, HTTP, and{" "}
            <strong className="text-[var(--foreground)] font-normal">Class-Based Weighted Fair Queueing (CBWFQ)</strong> with real-time packet trace analytics.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4">
            {STATS.map((s) => (
              <div key={s.label} className="space-y-0.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  {s.label}
                </div>
                <div className="text-xl font-normal text-[var(--foreground)]">{s.value}</div>
                <div className="text-[11px] text-[var(--muted)]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section nav */}
        <nav className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-[var(--muted)] font-mono mr-2">Jump to:</span>
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Sections */}
        <section id="topology" className="scroll-mt-20">
          <InteractiveTopologyDiagram />
        </section>

        <section id="layers" className="scroll-mt-20">
          <NetworkLayerStack />
        </section>

        <section id="qos" className="scroll-mt-20">
          <QosComparisonVisualizer />
        </section>

        <section id="packet-flow" className="scroll-mt-20">
          <PacketFlowDiagram />
        </section>

        <section id="subnets" className="scroll-mt-20">
          <SubnetTable />
        </section>

        <section id="cli" className="scroll-mt-20">
          <CliShowcase />
        </section>

        {/* Engine Architecture */}
        <section id="engine" className="scroll-mt-20 space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-[var(--muted)]" />
              <h2 className="text-xl font-normal text-[var(--foreground)]">
                Simulation Engine Architecture
              </h2>
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">
              Pure TypeScript modular architecture in{" "}
              <code className="text-[var(--foreground)] text-[12px]">src/engine/</code> — stateless and deterministic networking algorithms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ENGINE_MODULES.map((m) => (
              <div
                key={m.file}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 space-y-2 hover:border-[var(--foreground)] transition"
              >
                <code className={`text-xs font-mono font-bold ${m.color}`}>
                  src/engine/{m.file}
                </code>
                <p className="text-xs text-[var(--muted)] leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center space-y-4">
          <h3 className="text-2xl font-normal text-[var(--foreground)]">
            Ready to build or simulate?
          </h3>
          <p className="text-sm text-[var(--muted)] max-w-lg mx-auto">
            Launch the visual canvas workspace to wire cables and configure policies,
            or load the pre-built reference project to run tests immediately.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={loadReferenceAndLaunch}
              className="rounded-lg border border-[var(--foreground)] bg-[var(--foreground)] px-5 py-2.5 text-sm text-[var(--background)] hover:opacity-80 transition"
            >
              Load Full Campus QoS Topology
            </button>
            <Link
              href="/workspace"
              className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-5 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--subtle)] transition"
            >
              Open Blank Workspace
            </Link>
            <Link
              href="/"
              className="text-sm text-[var(--muted)] underline underline-offset-4 hover:text-[var(--foreground)] transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
