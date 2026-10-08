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
  const color = !up ? "#ef4444" : settling ? "#f59e0b" : "#22c55e";

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
          strokeWidth: selected ? 3 : 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          className="pointer-events-none rounded bg-slate-900/90 px-1 text-[10px] text-slate-300"
        >
          {d?.fromPort} ↔ {d?.toPort}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
