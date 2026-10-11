"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo } from "react";
import { DeviceNode } from "./nodes/DeviceNode";
import { CableEdge } from "./edges/CableEdge";
import { useTopologyStore } from "@/store/topologyStore";
import type { DeviceModel } from "@/engine/types";

const nodeTypes = { device: DeviceNode };
const edgeTypes = { cable: CableEdge };

function CanvasInner() {
  const topology = useTopologyStore((s) => s.topology);
  const updateDevice = useTopologyStore((s) => s.updateDevice);
  const setSelectedDevice = useTopologyStore((s) => s.setSelectedDevice);
  const addDevice = useTopologyStore((s) => s.addDevice);
  const toolMode = useTopologyStore((s) => s.toolMode);
  const setPortPickerDeviceId = useTopologyStore((s) => s.setPortPickerDeviceId);
  const { screenToFlowPosition } = useReactFlow();

  const initialNodes: Node[] = useMemo(
    () =>
      topology.devices.map((d) => ({
        id: d.id,
        type: "device",
        position: d.position,
        data: { label: d.name, kind: d.kind, deviceId: d.id },
      })),
    [topology.devices],
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      topology.links.map((l) => ({
        id: l.id,
        source: l.from.deviceId,
        target: l.to.deviceId,
        type: "cable",
        data: {
          linkId: l.id,
          fromPort: l.from.portId,
          toPort: l.to.portId,
          createdAt: l.createdAt,
        },
      })),
    [topology.links],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      updateDevice(node.id, { position: node.position });
    },
    [updateDevice],
  );

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (toolMode === "cable") {
        setPortPickerDeviceId(node.id);
        return;
      }
      setSelectedDevice(node.id);
    },
    [toolMode, setPortPickerDeviceId, setSelectedDevice],
  );

  const onNodeDoubleClick = useCallback(
    (_: unknown, node: Node) => {
      setSelectedDevice(node.id);
    },
    [setSelectedDevice],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const model = e.dataTransfer.getData(
        "application/device-model",
      ) as DeviceModel;
      if (!model) return;
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      addDevice(model, position);
    },
    [addDevice, screenToFlowPosition],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeDragStop={onNodeDragStop}
      onNodeClick={onNodeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      fitView
      className="bg-[var(--background)]"
    >
      <Background gap={18} color="#d4d1c9" />
      <MiniMap
        pannable
        zoomable
        className="!border !border-[var(--border)] !bg-[var(--panel)] !rounded-lg !shadow-xs"
        nodeColor="#1a1a18"
        maskColor="rgba(248, 247, 244, 0.75)"
      />
      <Controls className="!border !border-[var(--border)] !bg-[var(--panel)] !rounded-lg !shadow-xs [&>button]:!border-b [&>button]:!border-[var(--border)] [&>button]:!bg-[var(--panel)] [&>button]:!fill-[var(--foreground)]" />
    </ReactFlow>
  );
}

export function NetworkCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
