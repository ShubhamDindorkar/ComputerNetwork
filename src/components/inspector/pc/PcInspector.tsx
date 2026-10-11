"use client";

import { useState } from "react";
import type { Device } from "@/engine/types";
import { useTopologyStore } from "@/store/topologyStore";
import { simulate } from "@/lib/apiClient";

export function PcInspector({ device }: { device: Device }) {
  const topology = useTopologyStore((s) => s.topology);
  const setTopology = useTopologyStore((s) => s.setTopology);
  const updateDevice = useTopologyStore((s) => s.updateDevice);
  const pc = device.pc!;
  const [browserUrl, setBrowserUrl] = useState("campus.local");
  const [browserHtml, setBrowserHtml] = useState<string | null>(null);
  const [browserErr, setBrowserErr] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"ip" | "browser">("ip");

  const setSimEvents = useTopologyStore((s) => s.setSimEvents);
  const setBottomTab = useTopologyStore((s) => s.setBottomTab);
  const setMode = useTopologyStore((s) => s.setMode);

  const patchIface = (patch: Partial<typeof pc.interface>) => {
    updateDevice(device.id, {
      pc: { ...pc, interface: { ...pc.interface, ...patch } },
    });
  };

  const renew = async () => {
    const res = await simulate(topology, {
      type: "dhcp-renew",
      deviceId: device.id,
    });
    if (res.topology) setTopology(res.topology);
  };

  const browse = async () => {
    const res = await simulate(topology, {
      type: "http",
      deviceId: device.id,
      url: browserUrl,
    });
    if (res.topology) setTopology(res.topology);
    if (res.output.startsWith("<")) {
      setBrowserHtml(res.output);
      setBrowserErr(null);
    } else {
      setBrowserErr(res.output);
      setBrowserHtml(null);
    }

    if (res.traces && res.traces.length > 0) {
      const batchEvents: import("@/store/topologyStore").SimEvent[] = [];
      let baseTime = 0;
      for (const tr of res.traces as { forwardTrace?: { deviceName: string; action: string; inPort?: string; outPort?: string }[] }[]) {
        const hops = tr.forwardTrace ?? [];
        hops.forEach((hop, hIdx) => {
          baseTime += 120;
          const prevHop = hIdx > 0 ? hops[hIdx - 1] : undefined;
          batchEvents.push({
            id: crypto.randomUUID(),
            timeMs: baseTime,
            lastDevice: prevHop ? prevHop.deviceName : "— (Source)",
            atDevice: hop.deviceName,
            type: "HTTP (TCP:80)",
            color: "#1a1a18",
            info: hop.action,
            packetIdx: 1,
            inPort: hop.inPort,
            outPort: hop.outPort,
          });
        });
      }
      if (batchEvents.length > 0) {
        setSimEvents(batchEvents);
        setBottomTab("simulation");
        setMode("simulation");
      }
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex gap-1.5">
        <button
          type="button"
          className={`rounded-lg px-3 py-1 text-xs transition shadow-2xs ${
            subTab === "ip"
              ? "border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium"
              : "border border-[var(--border)] bg-[var(--subtle)] text-[var(--foreground)] hover:bg-white"
          }`}
          onClick={() => setSubTab("ip")}
        >
          IP Configuration
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-1 text-xs transition shadow-2xs ${
            subTab === "browser"
              ? "border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium"
              : "border border-[var(--border)] bg-[var(--subtle)] text-[var(--foreground)] hover:bg-white"
          }`}
          onClick={() => setSubTab("browser")}
        >
          Web Browser
        </button>
      </div>

      {subTab === "ip" && (
        <div className="space-y-2.5 text-xs">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)]">
              <input
                type="radio"
                className="accent-[var(--foreground)]"
                checked={pc.interface.mode === "dhcp"}
                onChange={() => patchIface({ mode: "dhcp" })}
              />
              DHCP
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)]">
              <input
                type="radio"
                className="accent-[var(--foreground)]"
                checked={pc.interface.mode === "static"}
                onChange={() => patchIface({ mode: "static" })}
              />
              Static
            </label>
          </div>
          {pc.interface.mode === "static" && (
            <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3 shadow-2xs">
              <input
                className="w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
                placeholder="IP Address"
                value={pc.interface.ip ?? ""}
                onChange={(e) => patchIface({ ip: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
                placeholder="Subnet Mask"
                value={pc.interface.subnetMask ?? ""}
                onChange={(e) => patchIface({ subnetMask: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
                placeholder="Default Gateway"
                value={pc.interface.defaultGateway ?? ""}
                onChange={(e) => patchIface({ defaultGateway: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
                placeholder="DNS Server"
                value={pc.interface.dnsServer ?? ""}
                onChange={(e) => patchIface({ dnsServer: e.target.value })}
              />
            </div>
          )}
          {pc.interface.mode === "dhcp" && (
            <button
              type="button"
              className="rounded-lg border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] px-3 py-1.5 text-xs font-medium hover:opacity-90 transition shadow-2xs"
              onClick={() => void renew()}
            >
              Renew DHCP lease
            </button>
          )}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-3 text-xs font-mono text-[var(--foreground)] space-y-1 shadow-2xs">
            <div>IP: <span className="font-semibold">{pc.interface.ip ?? "(not assigned)"}</span></div>
            <div>Gateway: <span>{pc.interface.defaultGateway ?? "—"}</span></div>
            <div>DNS: <span>{pc.interface.dnsServer ?? "—"}</span></div>
          </div>
        </div>
      )}

      {subTab === "browser" && (
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs font-mono"
              value={browserUrl}
              onChange={(e) => setBrowserUrl(e.target.value)}
            />
            <button
              type="button"
              className="rounded-md border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] px-3 py-1 text-xs font-medium hover:opacity-90 transition shadow-2xs"
              onClick={() => void browse()}
            >
              Go
            </button>
          </div>
          {browserErr && (
            <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800 font-mono">
              {browserErr}
            </p>
          )}
          {browserHtml && (
            <iframe
              title="browser"
              className="h-44 w-full rounded-lg border border-[var(--border)] bg-white shadow-2xs"
              srcDoc={browserHtml}
            />
          )}
        </div>
      )}
    </div>
  );
}
