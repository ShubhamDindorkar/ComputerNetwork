"use client";

import { useState } from "react";
import { useTopologyStore } from "@/store/topologyStore";
import { RouterInspector } from "./router/RouterInspector";
import { ServerInspector } from "./server/ServerInspector";
import { PcInspector } from "./pc/PcInspector";
import { SwitchInspector } from "./switch/SwitchInspector";

export function InspectorPanel() {
  const selectedDeviceId = useTopologyStore((s) => s.selectedDeviceId);
  const topology = useTopologyStore((s) => s.topology);
  const updateDevice = useTopologyStore((s) => s.updateDevice);
  const device = topology.devices.find((d) => d.id === selectedDeviceId);

  const [tab, setTab] = useState("config");

  if (!device) {
    return (
      <aside className="w-80 border-l border-slate-700 bg-[var(--panel)] p-4 text-sm text-slate-400">
        Double-click a device to open the inspector (Config / Desktop / CLI).
      </aside>
    );
  }

  const tabs =
    device.kind === "pc"
      ? ["desktop", "cli"]
      : device.kind === "router"
        ? ["config", "cli"]
        : ["config"];

  const activeTab = tabs.includes(tab) ? tab : tabs[0];

  return (
    <aside className="flex w-96 flex-col border-l border-slate-700 bg-[var(--panel)] text-sm">
      <div className="border-b border-slate-700 p-3">
        <input
          className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 font-medium"
          value={device.name}
          onChange={(e) => updateDevice(device.id, { name: e.target.value })}
        />
        <p className="mt-1 text-xs text-slate-400">{device.model}</p>
        <div className="mt-2 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded px-2 py-1 text-xs capitalize ${
                activeTab === t ? "bg-blue-600" : "bg-slate-800"
              }`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {device.kind === "router" && activeTab === "config" && (
          <RouterInspector device={device} />
        )}
        {device.kind === "router" && activeTab === "cli" && (
          <RouterCli deviceId={device.id} />
        )}
        {device.kind === "switch" && <SwitchInspector device={device} />}
        {device.kind === "server" && <ServerInspector device={device} />}
        {device.kind === "pc" && activeTab === "desktop" && (
          <PcInspector device={device} />
        )}
        {device.kind === "pc" && activeTab === "cli" && (
          <PcCli deviceId={device.id} />
        )}
      </div>
    </aside>
  );
}

function CliTerminal({
  deviceId,
  router,
}: {
  deviceId: string;
  router?: boolean;
}) {
  const topology = useTopologyStore((s) => s.topology);
  const setTopology = useTopologyStore((s) => s.setTopology);
  const mode = useTopologyStore((s) => s.mode);
  const pushSimEvents = useTopologyStore((s) => s.pushSimEvents);
  const clearSimEvents = useTopologyStore((s) => s.clearSimEvents);
  const [history, setHistory] = useState<string[]>(["C:\\>"]);
  const [input, setInput] = useState("");

  const run = async () => {
    const cmd = input.trim();
    if (!cmd) return;
    const { simulate } = await import("@/lib/apiClient");
    const action = router
      ? { type: "router-cli" as const, deviceId, command: cmd }
      : { type: "cli" as const, deviceId, command: cmd };
    const res = await simulate(topology, action);
    if (res.topology) setTopology(res.topology);
    const out = res.output ? res.output.split("\r\n") : [];
    setHistory((h) => [
      ...h,
      router ? `Router>${cmd}` : `C:\\>${cmd}`,
      ...out,
      router ? "Router>" : "C:\\>",
    ]);
    setInput("");
    if (mode === "simulation" && res.traces?.length) {
      clearSimEvents();
      const traces = res.traces as { forwardTrace?: { deviceName: string; action: string }[] }[];
      let t = 0;
      for (const tr of traces) {
        for (const hop of tr.forwardTrace ?? []) {
          t += 200;
          pushSimEvents([
            {
              id: crypto.randomUUID(),
              timeMs: t,
              lastDevice: hop.deviceName,
              atDevice: hop.deviceName,
              type: cmd.startsWith("ping") ? "ICMP" : "Packet",
              color: "#60a5fa",
            },
          ]);
        }
      }
    }
  };

  return (
    <div className="flex h-64 flex-col rounded border border-slate-700 bg-black font-mono text-xs">
      <pre className="flex-1 overflow-auto p-2 text-green-400">
        {history.join("\n")}
      </pre>
      <input
        className="border-t border-slate-700 bg-slate-900 p-2 text-green-400 outline-none"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void run()}
      />
    </div>
  );
}

function PcCli({ deviceId }: { deviceId: string }) {
  return <CliTerminal deviceId={deviceId} />;
}

function RouterCli({ deviceId }: { deviceId: string }) {
  return <CliTerminal deviceId={deviceId} router />;
}
