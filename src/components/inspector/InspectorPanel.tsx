"use client";

import { useState } from "react";
import { useTopologyStore, type SimEvent } from "@/store/topologyStore";
import { simulate } from "@/lib/apiClient";
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
      <aside className="w-80 border-l border-[var(--border)] bg-[var(--panel)] p-5 text-sm text-[var(--muted)]">
        Double-click a device on the canvas to open the inspector (Config / Desktop / CLI).
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
    <aside className="flex w-96 flex-col border-l border-[var(--border)] bg-[var(--panel)] text-sm">
      <div className="border-b border-[var(--border)] p-3.5 space-y-2">
        <input
          className="w-full rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 font-medium text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none shadow-2xs"
          value={device.name}
          onChange={(e) => updateDevice(device.id, { name: e.target.value })}
        />
        <p className="text-xs text-[var(--muted)] font-mono">{device.model}</p>
        <div className="flex gap-1.5 pt-1">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded-lg px-3 py-1 text-xs capitalize transition shadow-2xs ${
                activeTab === t
                  ? "border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium"
                  : "border border-[var(--border)] bg-[var(--subtle)] text-[var(--foreground)] hover:bg-white"
              }`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3.5">
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
  const setSimEvents = useTopologyStore((s) => s.setSimEvents);
  const setBottomTab = useTopologyStore((s) => s.setBottomTab);
  const setMode = useTopologyStore((s) => s.setMode);
  const [history, setHistory] = useState<string[]>(["C:\\>"]);
  const [input, setInput] = useState("");

  const run = async () => {
    const cmd = input.trim();
    if (!cmd) return;
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

    if (res.traces && res.traces.length > 0) {
      const traces = res.traces as {
        success?: boolean;
        forwardTrace?: {
          deviceId: string;
          deviceName: string;
          action: string;
          inPort?: string;
          outPort?: string;
        }[];
      }[];

      const batchEvents: SimEvent[] = [];
      let baseTime = 0;

      traces.forEach((tr, pIdx) => {
        const hops = tr.forwardTrace ?? [];
        hops.forEach((hop, hIdx) => {
          baseTime += 120;
          const prevHop = hIdx > 0 ? hops[hIdx - 1] : undefined;
          batchEvents.push({
            id: crypto.randomUUID(),
            timeMs: baseTime,
            lastDevice: prevHop ? prevHop.deviceName : "— (Source)",
            atDevice: hop.deviceName,
            type: cmd.toLowerCase().startsWith("ping")
              ? `ICMP Echo #${pIdx + 1}`
              : cmd.toLowerCase().startsWith("tracert")
                ? `ICMP Hop #${hIdx + 1}`
                : "Packet",
            color: "#1a1a18",
            info: hop.action,
            packetIdx: pIdx + 1,
            inPort: hop.inPort,
            outPort: hop.outPort,
          });
        });
      });

      if (batchEvents.length > 0) {
        setSimEvents(batchEvents);
        setBottomTab("simulation");
        setMode("simulation");
      }
    }
  };

  return (
    <div className="flex h-72 flex-col rounded-lg border border-[var(--border)] bg-[#171717] font-mono text-xs overflow-hidden shadow-xs">
      <pre className="flex-1 overflow-auto p-3 text-[#f5f5f4] leading-relaxed select-text">
        {history.join("\n")}
      </pre>
      <div className="flex border-t border-[#333333] bg-[#222222]">
        <input
          className="flex-1 bg-transparent p-2.5 text-[#f5f5f4] placeholder-[#888888] outline-none font-mono"
          placeholder="Type command (e.g. ping 192.168.1.20)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void run()}
        />
      </div>
    </div>
  );
}

function PcCli({ deviceId }: { deviceId: string }) {
  return <CliTerminal deviceId={deviceId} />;
}

function RouterCli({ deviceId }: { deviceId: string }) {
  return <CliTerminal deviceId={deviceId} router />;
}
