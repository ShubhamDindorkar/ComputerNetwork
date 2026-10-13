"use client";

import { useTopologyStore } from "@/store/topologyStore";
import { validateTopology } from "@/lib/apiClient";

export function ChecklistPanel() {
  const topology = useTopologyStore((s) => s.topology);
  const lastValidation = useTopologyStore((s) => s.lastValidation);
  const setLastValidation = useTopologyStore((s) => s.setLastValidation);
  const setSelectedDevice = useTopologyStore((s) => s.setSelectedDevice);

  const run = async () => {
    const v = await validateTopology(topology);
    setLastValidation(v);
  };

  const v = lastValidation;

  return (
    <div className="text-xs space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] px-3 py-1.5 text-xs font-medium hover:opacity-90 transition shadow-2xs"
          onClick={() => void run()}
        >
          Run Lab Validation (Parts 3–8)
        </button>
        {v && (
          <span className="text-xs font-semibold text-[var(--foreground)]">
            {v.allPass ? "✓ All checklist items and functional tests passed" : "⚠ Configuration issues detected"}
          </span>
        )}
      </div>

      {!v && (
        <p className="text-xs text-[var(--muted)]">
          Click &ldquo;Run Lab Validation&rdquo; to test your topology configurations (DHCP, DNS, OSPF, and QoS queues) against lab specifications.
        </p>
      )}

      {v && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3">
              <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Specification Checklist
              </h4>
              <ul className="max-h-36 space-y-1.5 overflow-auto pr-1">
                {v.checklist.map((c) => (
                  <li
                    key={c.id}
                    className={`font-mono text-xs flex items-start gap-1.5 ${
                      c.pass ? "text-[var(--foreground)]" : "text-red-700 font-medium"
                    }`}
                  >
                    <span className="shrink-0">{c.pass ? "✓" : "✗"}</span>
                    <div>
                      <span>[{c.part}] {c.title}</span>
                      {!c.pass && c.hint && (
                        <span className="block text-[11px] text-[var(--muted)] mt-0.5">{c.hint}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3">
              <h4 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Functional Verification Tests
              </h4>
              <ul className="max-h-36 space-y-1.5 overflow-auto pr-1">
                {v.tests.map((t) => (
                  <li
                    key={t.id}
                    className={`font-mono text-xs flex items-center justify-between ${
                      t.pass ? "text-[var(--foreground)]" : "text-red-700 font-medium"
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className="rounded border border-[var(--border)] bg-white px-1.5 py-0.5 text-[10px] font-semibold">
                      {t.pass ? "PASS" : "FAIL"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            type="button"
            className="text-xs font-medium text-[var(--foreground)] underline hover:opacity-80"
            onClick={() => {
              const fail = v.checklist.find((c) => !c.pass);
              if (!fail) return;
              const dev = topology.devices.find((d) =>
                fail.title.includes(d.name),
              );
              if (dev) setSelectedDevice(dev.id);
            }}
          >
            Jump to first failing device (if named)
          </button>
        </>
      )}
    </div>
  );
}
