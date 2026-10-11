"use client";

import type { ReactNode } from "react";
import { Cable, Monitor, Router, Server, SwitchCamera } from "lucide-react";
import { useTopologyStore } from "@/store/topologyStore";
import type { DeviceModel } from "@/engine/types";

const ITEMS: { model: DeviceModel; label: string; icon: ReactNode }[] = [
  { model: "cisco-2911", label: "Cisco 2911", icon: <Router className="h-4 w-4" /> },
  {
    model: "catalyst-2960-24tt",
    label: "2960-24TT",
    icon: <SwitchCamera className="h-4 w-4" />,
  },
  { model: "server", label: "Server", icon: <Server className="h-4 w-4" /> },
  { model: "pc", label: "PC", icon: <Monitor className="h-4 w-4" /> },
];

export function DevicePalette() {
  const toolMode = useTopologyStore((s) => s.toolMode);
  const setToolMode = useTopologyStore((s) => s.setToolMode);

  const onDragStart = (e: React.DragEvent, model: DeviceModel) => {
    e.dataTransfer.setData("application/device-model", model);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="flex w-52 flex-col gap-2.5 border-r border-[var(--border)] bg-[var(--panel)] p-3.5 text-sm select-none">
      <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--muted)]">
        Devices
      </p>
      <div className="flex flex-col gap-1.5">
        {ITEMS.map((item) => (
          <div
            key={item.model}
            draggable
            onDragStart={(e) => onDragStart(e, item.model)}
            className="flex cursor-grab items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--subtle)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-white active:cursor-grabbing shadow-2xs"
          >
            <span className="text-[var(--foreground)] opacity-80">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--muted)]">
        Connections
      </p>
      <button
        type="button"
        onClick={() => setToolMode(toolMode === "cable" ? "select" : "cable")}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition shadow-2xs ${
          toolMode === "cable"
            ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium"
            : "border-[var(--border)] bg-[var(--subtle)] text-[var(--foreground)] hover:bg-white hover:border-[var(--foreground)]"
        }`}
      >
        <Cable className="h-4 w-4" />
        Copper Straight
      </button>

      <div className="mt-auto rounded-lg border border-[var(--border)] bg-[var(--subtle)] p-2.5 text-[11px] text-[var(--muted)] leading-relaxed">
        Drag devices onto canvas. Double-click to inspect. Del to remove.
      </div>
    </aside>
  );
}
