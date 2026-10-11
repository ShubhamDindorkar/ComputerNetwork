"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { useEffect, useState } from "react";
import { isLinkUp } from "@/engine/l2";
import { useTopologyStore } from "@/store/topologyStore";

export type CableEdgeData = {
  linkId: string;
  fromPort: string;
  toPort: string;
  createdAt?: number;
};

export function CableEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, data, selected } = props;
  const d = data as CableEdgeData | undefined;
  const topology = useTopologyStore((s) => s.topology);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 500);
    return () => clearInterval(t);
  }, []);

  const link = topology.links.find((l) => l.id === d?.linkId);
  const up = link ? isLinkUp(topology, link) : false;
  const age = link?.createdAt ? Date.now() - link.createdAt : 99999;
  const settling = age < 2000;
  const color = !up ? "#dc2626" : settling ? "#78716c" : "#1a1a18";

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  void tick;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 2.5 : 1.5,
          opacity: settling ? 0.6 : 0.85,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          className="pointer-events-none rounded border border-[var(--border)] bg-[var(--panel)]/95 px-1.5 py-0.5 text-[10px] font-mono text-[var(--foreground)] shadow-xs"
        >
          {d?.fromPort} ↔ {d?.toPort}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
