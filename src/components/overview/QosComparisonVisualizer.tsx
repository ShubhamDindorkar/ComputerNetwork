"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, AlertTriangle, Check, Sliders } from "lucide-react";

/* ─── types ─────────────────────────────────────────────────────────────── */
type PacketClass = "DHCP/DNS" | "Web" | "Default";
type Mode = "cbwfq" | "fifo";

interface Packet {
  id: string;
  cls: PacketClass;
  proto: string;
  port?: number;
  arrivedAt: number;   // ms since sim start
  dequeuedAt?: number; // ms since sim start
}

/* ─── constants ─────────────────────────────────────────────────────────── */
const CLASS_CFG: Record<PacketClass, { bw: number; priority: number; color: string; border: string; bg: string }> = {
  "DHCP/DNS": { bw: 50, priority: 3, color: "text-[var(--foreground)]", border: "border-[var(--border)]", bg: "bg-[var(--subtle)]" },
  "Web":      { bw: 30, priority: 2, color: "text-[var(--foreground)]", border: "border-[var(--border)]", bg: "bg-[var(--subtle)]" },
  "Default":  { bw: 20, priority: 1, color: "text-[var(--foreground)]", border: "border-[var(--border)]", bg: "bg-[var(--subtle)]" },
};

const BURST: { cls: PacketClass; proto: string; port?: number }[] = [
  ...Array(20).fill(null).map(() => ({ cls: "Web" as PacketClass, proto: "TCP", port: 80 })),
  ...Array(10).fill(null).map(() => ({ cls: "Default" as PacketClass, proto: "ICMP" })),
  ...Array(3).fill(null).map(() => ({ cls: "DHCP/DNS" as PacketClass, proto: "UDP", port: 67 })),
  ...Array(3).fill(null).map(() => ({ cls: "DHCP/DNS" as PacketClass, proto: "UDP", port: 53 })),
];

function buildQueue(mode: Mode): Packet[] {
  // Shuffle for realistic arrival
  const shuffled = [...BURST].sort(() => Math.random() - 0.5);
  if (mode === "cbwfq") {
    // Group by priority, then interleave by bandwidth weight
    const groups: Record<PacketClass, typeof BURST> = { "DHCP/DNS": [], "Web": [], "Default": [] };
    shuffled.forEach((p) => groups[p.cls].push(p));
    const out: typeof BURST = [];
    let remaining = true;
    while (remaining) {
      remaining = false;
      for (const cls of ["DHCP/DNS", "Web", "Default"] as PacketClass[]) {
        const n = Math.ceil(CLASS_CFG[cls].bw / 20); // tokens per round
        for (let i = 0; i < n; i++) {
          const p = groups[cls].shift();
          if (p) { out.push(p); remaining = true; }
        }
      }
    }
    return out.map((p, i) => ({ id: `p${i}`, cls: p.cls, proto: p.proto, port: p.port, arrivedAt: i * 40 }));
  } else {
    return shuffled.map((p, i) => ({ id: `p${i}`, cls: p.cls, proto: p.proto, port: p.port, arrivedAt: i * 40 }));
  }
}

/* ─── component ─────────────────────────────────────────────────────────── */
export function QosComparisonVisualizer() {
  const [mode, setMode] = useState<Mode>("cbwfq");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);        // ms of sim time
  const [finished, setFinished] = useState<Packet[]>([]);
  const [queue, setQueue] = useState<Packet[]>([]);
  const [allPackets, setAllPackets] = useState<Packet[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const SIM_SPEED = 20; // ms real per tick
  const TICK_MS   = 80; // ms of sim per tick

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRunning(false);
    setElapsed(0);
    elapsedRef.current = 0;
    const pkts = buildQueue(mode);
    setAllPackets(pkts);
    setQueue([]);
    setFinished([]);
  }, [mode]);

  useEffect(() => { reset(); }, [reset]);

  const start = () => {
    if (running) return;
    setRunning(true);
    timerRef.current = setInterval(() => {
      elapsedRef.current += TICK_MS;
      const t = elapsedRef.current;
      setElapsed(t);

      setAllPackets((prev) => {
        const arrived = prev.filter((p) => p.arrivedAt <= t && !p.dequeuedAt);
        setQueue(arrived);

        // Dequeue one per tick (service rate)
        if (arrived.length > 0) {
          const toDequeue = arrived[0];
          const next = prev.map((p) =>
            p.id === toDequeue.id ? { ...p, dequeuedAt: t } : p
          );
          setFinished((f) => [...f, { ...toDequeue, dequeuedAt: t }]);
          return next;
        }
        return prev;
      });

      // Stop when all done
      setAllPackets((prev) => {
        const done = prev.every((p) => p.dequeuedAt !== undefined);
        if (done) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setRunning(false);
        }
        return prev;
      });
    }, SIM_SPEED);
  };

  const pause = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRunning(false);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // Compute stats from finished packets
  const stats: Record<PacketClass, { count: number; latencies: number[] }> = {
    "DHCP/DNS": { count: 0, latencies: [] },
    "Web":      { count: 0, latencies: [] },
    "Default":  { count: 0, latencies: [] },
  };
  finished.forEach((p) => {
    if (p.dequeuedAt !== undefined) {
      stats[p.cls].count++;
      stats[p.cls].latencies.push(p.dequeuedAt - p.arrivedAt);
    }
  });
  const avgMs = (cls: PacketClass) => {
    const ls = stats[cls].latencies;
    return ls.length ? Math.round(ls.reduce((a, b) => a + b, 0) / ls.length) : null;
  };

  const totalArrived = allPackets.filter((p) => p.arrivedAt <= elapsed).length;
  const totalDone    = finished.length;
  const pct = totalArrived > 0 ? Math.round((totalDone / 36) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-[var(--muted)]" />
          <h2 className="text-xl font-normal text-[var(--foreground)]">
            QoS Live Simulation — CBWFQ vs FIFO
          </h2>
        </div>
        <p className="text-sm text-[var(--muted)] mt-1">
          Burst of 36 packets (20 HTTP · 10 Default · 3 DHCP · 3 DNS) scheduled
          through Core-Router Gi0/0 egress. Watch how CBWFQ ensures DHCP/DNS deliver first.
        </p>
      </div>

      {/* Mode selector + controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-sm">
          {(["cbwfq", "fifo"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); }}
              className={`px-4 py-2 font-mono text-xs transition ${
                mode === m
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "bg-[var(--panel)] text-[var(--muted)] hover:bg-[var(--subtle)]"
              }`}
            >
              {m === "cbwfq" ? "CBWFQ (Campus-QoS-Policy)" : "Standard FIFO (No QoS)"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--subtle)] transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          {running ? (
            <button
              type="button"
              onClick={pause}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--foreground)] bg-[var(--foreground)] px-3.5 py-1.5 text-xs text-[var(--background)] hover:opacity-80 transition"
            >
              <Pause className="h-3.5 w-3.5" />
              Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={totalDone === 36}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--foreground)] bg-[var(--foreground)] px-3.5 py-1.5 text-xs text-[var(--background)] hover:opacity-80 transition disabled:opacity-40"
            >
              <Play className="h-3.5 w-3.5" />
              {totalDone === 36 ? "Done" : "Run Simulation"}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted)]">
          <span>Packets scheduled: {totalDone} / 36</span>
          <span>Sim time: {elapsed} ms</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--subtle)] overflow-hidden border border-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--foreground)] transition-all duration-75"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Queue + finished split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Egress queue */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-normal text-[var(--foreground)]">Egress Queue — Gi0/0</h3>
            <code className="text-[10px] font-mono text-[var(--muted)]">{queue.length} waiting</code>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[80px] content-start">
            {queue.length === 0 && elapsed === 0 && (
              <p className="text-xs text-[var(--muted)] italic">Press &ldquo;Run Simulation&rdquo; to start.</p>
            )}
            {queue.map((p) => {
              const cfg = CLASS_CFG[p.cls];
              return (
                <span
                  key={p.id}
                  className={`rounded border ${cfg.border} ${cfg.bg} ${cfg.color} px-2 py-0.5 text-[10px] font-mono leading-tight`}
                >
                  {p.proto}{p.port ? `:${p.port}` : ""}
                </span>
              );
            })}
          </div>
        </div>

        {/* Delivered / done */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-normal text-[var(--foreground)]">Scheduled &amp; Delivered</h3>
            <code className="text-[10px] font-mono text-[var(--muted)]">{totalDone} sent</code>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[80px] content-start max-h-[140px] overflow-y-auto">
            {finished.map((p) => {
              const cfg = CLASS_CFG[p.cls];
              return (
                <span
                  key={p.id}
                  className={`rounded border ${cfg.border} ${cfg.bg} ${cfg.color} px-2 py-0.5 text-[10px] font-mono leading-tight opacity-70`}
                >
                  ✓ {p.proto}{p.port ? `:${p.port}` : ""}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live class latency stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["DHCP/DNS", "Web", "Default"] as PacketClass[]).map((cls) => {
          const cfg = CLASS_CFG[cls];
          const avg = avgMs(cls);
          const count = stats[cls].count;
          return (
            <div key={cls} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 space-y-1`}>
              <div className={`text-[11px] font-mono uppercase tracking-wider ${cfg.color}`}>
                {cls} — Priority {cfg.priority}
              </div>
              <div className={`text-2xl font-normal ${cfg.color}`}>
                {avg !== null ? `${avg} ms` : "—"}
              </div>
              <div className="text-[11px] text-[var(--muted)]">
                avg latency · {count} / {cls === "DHCP/DNS" ? 6 : cls === "Web" ? 20 : 10} delivered · {cfg.bw}% BW
              </div>
              {/* Mini BW bar */}
              <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden mt-1.5">
                <div
                  className="h-full rounded-full bg-[var(--foreground)]"
                  style={{ width: `${cfg.bw}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Outcome note */}
      {totalDone === 36 && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 text-xs leading-relaxed ${
          mode === "cbwfq"
            ? "border-[var(--border)] bg-[var(--subtle)] text-[var(--foreground)] font-medium"
            : "border-red-200 bg-red-50 text-red-900"
        }`}>
          {mode === "cbwfq"
            ? <Check className="h-4 w-4 shrink-0 mt-0.5 text-[var(--foreground)]" />
            : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />}
          <div>
            {mode === "cbwfq"
              ? <><strong>CBWFQ result:</strong> DHCP/DNS packets were serviced first with 50% priority bandwidth, achieving lowest average latency despite lower packet volume. Critical infrastructure services remained unaffected under high HTTP load.</>
              : <><strong>FIFO result:</strong> DHCP/DNS packets queued behind 20 HTTP packets in arrival order. Average latency spikes substantially — causing real-world client timeouts and DNS query drops.</>}
          </div>
        </div>
      )}

      {/* Static class map reference */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <h3 className="text-sm font-normal text-[var(--foreground)] mb-4">
          Campus-QoS-Policy Class Map Reference
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="text-left py-2 pr-6 font-medium">Class Map</th>
                <th className="text-left py-2 pr-6 font-medium">Match Protocol</th>
                <th className="text-left py-2 pr-6 font-medium">Port(s)</th>
                <th className="text-left py-2 pr-6 font-medium">Priority</th>
                <th className="text-left py-2 pr-6 font-medium">Bandwidth</th>
                <th className="text-left py-2 font-medium">Queue Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr>
                <td className="py-2.5 pr-6 text-[var(--foreground)] font-semibold">DHCP-DNS</td>
                <td className="py-2.5 pr-6 text-[var(--foreground)]">UDP</td>
                <td className="py-2.5 pr-6 text-[var(--foreground)]">67, 68, 53</td>
                <td className="py-2.5 pr-6 text-[var(--foreground)]">3 (Highest)</td>
                <td className="py-2.5 pr-6 text-[var(--foreground)]">50%</td>
                <td className="py-2.5 text-[var(--foreground)]">WFQ</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-6 text-[var(--foreground)] font-semibold">Web-Traffic</td>
                <td className="py-2.5 pr-6 text-[var(--foreground)]">TCP</td>
                <td className="py-2.5 pr-6 text-[var(--foreground)]">80, 443</td>
                <td className="py-2.5 pr-6 text-[var(--foreground)]">2 (Medium)</td>
                <td className="py-2.5 pr-6 text-[var(--foreground)]">30%</td>
                <td className="py-2.5 text-[var(--foreground)]">WFQ</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-6 text-[var(--foreground)] font-semibold">Default-Traffic</td>
                <td className="py-2.5 pr-6 text-[var(--foreground)]">any</td>
                <td className="py-2.5 pr-6 text-[var(--foreground)]">—</td>
                <td className="py-2.5 pr-6 text-[var(--foreground)]">1 (Best Effort)</td>
                <td className="py-2.5 pr-6 text-[var(--foreground)]">20%</td>
                <td className="py-2.5 text-[var(--foreground)]">FIFO</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
