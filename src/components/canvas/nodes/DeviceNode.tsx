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
  router: <Router className="h-5 w-5 text-[var(--foreground)]" />,
  switch: <SwitchCamera className="h-5 w-5 text-[var(--foreground)]" />,
  server: <Server className="h-5 w-5 text-[var(--foreground)]" />,
  pc: <Monitor className="h-5 w-5 text-[var(--foreground)]" />,
};

export function DeviceNode({ data, selected }: NodeProps) {
  const d = data as DeviceNodeData;
  return (
    <div
      className={`min-w-[130px] rounded-lg border bg-[var(--panel)] px-3.5 py-2.5 shadow-xs transition ${
        selected
          ? "border-[var(--foreground)] ring-2 ring-[var(--foreground)]/15 shadow-md"
          : "border-[var(--border)] hover:border-[#a8a29e]"
      }`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--subtle)]">
          {icons[d.kind]}
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-medium">
            {d.kind}
          </div>
          <div className="text-xs font-semibold text-[var(--foreground)]">
            {d.label}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
