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
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        <button
          type="button"
          className={`rounded px-2 py-1 text-xs ${subTab === "ip" ? "bg-blue-600" : "bg-slate-800"}`}
          onClick={() => setSubTab("ip")}
        >
          IP Configuration
        </button>
        <button
          type="button"
          className={`rounded px-2 py-1 text-xs ${subTab === "browser" ? "bg-blue-600" : "bg-slate-800"}`}
          onClick={() => setSubTab("browser")}
        >
          Web Browser
        </button>
      </div>

      {subTab === "ip" && (
        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={pc.interface.mode === "dhcp"}
              onChange={() => patchIface({ mode: "dhcp" })}
            />
            DHCP
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={pc.interface.mode === "static"}
              onChange={() => patchIface({ mode: "static" })}
            />
            Static
          </label>
          {pc.interface.mode === "static" && (
            <>
              <input
                className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1"
                placeholder="IP"
                value={pc.interface.ip ?? ""}
                onChange={(e) => patchIface({ ip: e.target.value })}
              />
              <input
                className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1"
                placeholder="Mask"
                value={pc.interface.subnetMask ?? ""}
                onChange={(e) => patchIface({ subnetMask: e.target.value })}
              />
              <input
                className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1"
                placeholder="Gateway"
                value={pc.interface.defaultGateway ?? ""}
                onChange={(e) => patchIface({ defaultGateway: e.target.value })}
              />
              <input
                className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1"
                placeholder="DNS"
                value={pc.interface.dnsServer ?? ""}
                onChange={(e) => patchIface({ dnsServer: e.target.value })}
              />
            </>
          )}
          {pc.interface.mode === "dhcp" && (
            <button
              type="button"
              className="rounded bg-slate-800 px-2 py-1"
              onClick={() => void renew()}
            >
              Renew DHCP
            </button>
          )}
          <div className="rounded bg-slate-900 p-2 text-slate-400">
            <div>IP: {pc.interface.ip ?? "(not assigned)"}</div>
            <div>Gateway: {pc.interface.defaultGateway ?? "—"}</div>
            <div>DNS: {pc.interface.dnsServer ?? "—"}</div>
          </div>
        </div>
      )}

      {subTab === "browser" && (
        <div className="space-y-2">
          <input
            className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs"
            value={browserUrl}
            onChange={(e) => setBrowserUrl(e.target.value)}
          />
          <button
            type="button"
            className="rounded bg-blue-700 px-2 py-1 text-xs"
            onClick={() => void browse()}
          >
            Go
          </button>
          {browserErr && (
            <p className="text-xs text-red-400">{browserErr}</p>
          )}
          {browserHtml && (
            <iframe
              title="browser"
              className="h-40 w-full rounded border border-slate-700 bg-white"
              srcDoc={browserHtml}
            />
          )}
        </div>
      )}
    </div>
  );
}
