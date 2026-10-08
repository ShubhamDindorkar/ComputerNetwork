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
    <div className="text-xs">
      <button
        type="button"
        className="mb-2 rounded bg-emerald-700 px-3 py-1"
        onClick={() => void run()}
      >
        Run all tests (Parts 3–8)
      </button>
      {!v && (
        <p className="text-slate-500">
          Click Validate or Run all tests to check your topology against the lab
          guide.
        </p>
      )}
      {v && (
        <>
          <p
            className={`mb-2 font-medium ${v.allPass ? "text-green-400" : "text-amber-400"}`}
          >
            {v.allPass ? "All checklist items and tests passed." : "Some items need attention."}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="mb-1 font-semibold">Checklist</h4>
              <ul className="max-h-32 space-y-0.5 overflow-auto">
                {v.checklist.map((c) => (
                  <li
                    key={c.id}
                    className={c.pass ? "text-green-500" : "text-red-400"}
                  >
                    [{c.part}] {c.title}
                    {!c.pass && c.hint && (
                      <span className="block text-slate-500">{c.hint}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-1 font-semibold">Functional tests</h4>
              <ul className="max-h-32 space-y-0.5 overflow-auto">
                {v.tests.map((t) => (
                  <li
                    key={t.id}
                    className={t.pass ? "text-green-500" : "text-red-400"}
                  >
                    {t.name} — {t.pass ? "PASS" : "FAIL"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            type="button"
            className="mt-2 text-blue-400"
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
