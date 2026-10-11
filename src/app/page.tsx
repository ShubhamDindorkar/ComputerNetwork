import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { LandingActions } from "@/components/landing/LandingActions";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-10 px-6 py-20">
      {/* Header label */}
      <div className="space-y-4">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--muted)]">
          Computer Network Lab · Virtual Companion
        </p>
        <h1 className="text-4xl sm:text-[3.25rem] leading-[1.1] font-normal text-[var(--foreground)]">
          Campus Network<br />
          <span className="italic">QoS Simulator</span>
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed max-w-xl">
          Build the 12-device campus topology from your lab guide. Configure DHCP,
          DNS, HTTP, OSPF, and Quality of Service policies — then run ping,
          nslookup, and web tests directly in the browser.
        </p>
      </div>

      {/* Divider */}
      <hr className="border-[var(--border)]" />

      <LandingActions />

      {/* Featured Overview Card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--muted)]">
              Documentation
            </p>
            <h2 className="text-lg font-normal text-[var(--foreground)]">
              Project Overview &amp; CN Concepts
            </h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed max-w-md">
              Interactive topology diagram, 5-layer OSI breakdown, QoS queuing
              mechanics, packet forwarding lifecycle, and addressing plan.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {["12 Devices", "3 Subnets", "OSI L2–L7", "CBWFQ QoS"].map((t) => (
                <span
                  key={t}
                  className="rounded border border-[var(--border)] bg-[var(--subtle)] px-2.5 py-0.5 text-[11px] font-mono text-[var(--muted)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <Link
            href="/overview"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--foreground)] bg-[var(--foreground)] px-4 py-2.5 text-sm text-[var(--background)] transition hover:opacity-80"
          >
            <BookOpen className="h-4 w-4" />
            <span>Open Overview</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Already working?{" "}
        <Link href="/workspace" className="underline underline-offset-4 hover:text-[var(--foreground)] transition-colors">
          Open workspace →
        </Link>
      </p>
    </main>
  );
}
