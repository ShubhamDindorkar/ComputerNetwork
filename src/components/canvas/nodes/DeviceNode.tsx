"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Monitor, Router, Server, SwitchCamera } from "lucide-react";
import type { DeviceKind } from "@/engine/types";

export type DeviceNodeData = {
  label: string;
  kind: DeviceKind;
  deviceId: string;
};

const icons: Record<DeviceKind, React.ReactNode> = {
  router: <Router className="h-6 w-6 text-sky-400" />,
  switch: <SwitchCamera className="h-6 w-6 text-emerald-400" />,
  server: <Server className="h-6 w-6 text-violet-400" />,
  pc: <Monitor className="h-6 w-6 text-amber-300" />,
};

export function DeviceNode({ data, selected }: NodeProps) {
  const d = data as DeviceNodeData;
  return (
    <div
      className={`min-w-[120px] rounded-lg border-2 bg-slate-900 px-3 py-2 shadow-lg ${
        selected ? "border-blue-400" : "border-slate-600"
      }`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="flex items-center gap-2">
        {icons[d.kind]}
        <div>
          <div className="text-xs text-slate-400">{d.kind}</div>
          <div className="text-sm font-medium">{d.label}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
