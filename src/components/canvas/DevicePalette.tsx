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
    <aside className="flex w-48 flex-col gap-2 border-r border-slate-700 bg-[var(--panel)] p-3 text-sm">
      <p className="text-xs font-semibold uppercase text-slate-400">Devices</p>
      {ITEMS.map((item) => (
        <div
          key={item.model}
          draggable
          onDragStart={(e) => onDragStart(e, item.model)}
          className="flex cursor-grab items-center gap-2 rounded border border-slate-600 bg-slate-900 px-2 py-2 hover:border-blue-500"
        >
          {item.icon}
          <span>{item.label}</span>
        </div>
      ))}
      <p className="mt-4 text-xs font-semibold uppercase text-slate-400">
        Connections
      </p>
      <button
        type="button"
        onClick={() => setToolMode(toolMode === "cable" ? "select" : "cable")}
        className={`flex items-center gap-2 rounded border px-2 py-2 ${
          toolMode === "cable"
            ? "border-amber-500 bg-amber-950"
            : "border-slate-600 bg-slate-900"
        }`}
      >
        <Cable className="h-4 w-4" />
        Copper Straight
      </button>
      <p className="mt-auto text-xs text-slate-500">
        Drag devices onto canvas. Double-click to configure. Del to remove.
      </p>
    </aside>
  );
}
