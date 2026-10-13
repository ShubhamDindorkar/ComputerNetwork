"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createDevice,
  DEVICE_CATALOG,
} from "@/engine/catalog";
import { findLinkOnPort } from "@/engine/l2";
import type { DeviceModel, Topology, PortRef } from "@/engine/types";
import { blankTopology } from "@/engine/presets/blank";

export type WorkspaceMode = "realtime" | "simulation";
export type BottomTab = "simulation" | "checklist" | "qos";
export type ToolMode = "select" | "cable";

export interface SimEvent {
  id: string;
  timeMs: number;
  lastDevice: string;
  atDevice: string;
  type: string;
  color: string;
  info?: string;
  packetIdx?: number;
  inPort?: string;
  outPort?: string;
}

interface TopologyState {
  topology: Topology;
  selectedDeviceId: string | null;
  selectedLinkId: string | null;
  mode: WorkspaceMode;
  bottomTab: BottomTab;
  toolMode: ToolMode;
  cablePending: PortRef | null;
  portPickerDeviceId: string | null;
  simEvents: SimEvent[];
  lastValidation: import("@/engine/types").ValidationResult | null;
  counters: { router: number; switch: number; server: number; pc: number };

  loadTopology: (t: Topology) => void;
  resetBlank: () => void;
  setSelectedDevice: (id: string | null) => void;
  setSelectedLink: (id: string | null) => void;
  setMode: (m: WorkspaceMode) => void;
  setBottomTab: (t: BottomTab) => void;
  setToolMode: (t: ToolMode) => void;
  setCablePending: (p: PortRef | null) => void;
  setPortPickerDeviceId: (id: string | null) => void;
  addDevice: (model: DeviceModel, position: { x: number; y: number }) => void;
  updateDevice: (id: string, patch: Partial<import("@/engine/types").Device>) => void;
  removeDevice: (id: string) => void;
  addLink: (from: PortRef, to: PortRef) => string | null;
  removeLink: (id: string) => void;
  setTopology: (t: Topology) => void;
  setSimEvents: (events: SimEvent[]) => void;
  pushSimEvents: (events: SimEvent[]) => void;
  clearSimEvents: () => void;
  setLastValidation: (v: import("@/engine/types").ValidationResult | null) => void;
}

export const useTopologyStore = create<TopologyState>()(
  persist(
    (set, get) => ({
      topology: blankTopology(),
      selectedDeviceId: null,
      selectedLinkId: null,
      mode: "realtime",
      bottomTab: "checklist",
      toolMode: "select",
      cablePending: null,
      portPickerDeviceId: null,
      simEvents: [],
      lastValidation: null,
      counters: { router: 0, switch: 0, server: 0, pc: 0 },

      loadTopology: (t) =>
        set({
          topology: structuredClone(t),
          selectedDeviceId: null,
          cablePending: null,
      portPickerDeviceId: null,
          simEvents: [],
        }),

      resetBlank: () =>
        set({
          topology: blankTopology(),
          selectedDeviceId: null,
          cablePending: null,
      portPickerDeviceId: null,
          simEvents: [],
          lastValidation: null,
        }),

      setSelectedDevice: (id) => set({ selectedDeviceId: id, selectedLinkId: null }),
      setSelectedLink: (id) => set({ selectedLinkId: id, selectedDeviceId: null }),
      setMode: (m) => set({ mode: m }),
      setBottomTab: (t) => set({ bottomTab: t }),
      setToolMode: (t) => set({ toolMode: t, cablePending: null }),
      setCablePending: (p) => set({ cablePending: p }),
      setPortPickerDeviceId: (id) => set({ portPickerDeviceId: id }),

      addDevice: (model, position) => {
        const meta = DEVICE_CATALOG[model];
        const counters = { ...get().counters };
        const kindKey =
          meta.kind === "router"
            ? "router"
            : meta.kind === "switch"
              ? "switch"
              : meta.kind === "server"
                ? "server"
                : "pc";
        counters[kindKey]++;
        const defaultNames: Record<string, string> = {
          router: `Router${counters.router - 1}`,
          switch: `Switch${counters.switch - 1}`,
          server: `Server${counters.server - 1}`,
          pc: `PC${counters.pc - 1}`,
        };
        const id = `dev-${crypto.randomUUID()}`;
        const device = createDevice(
          model,
          id,
          defaultNames[kindKey] ?? meta.label,
          position,
        );
        set((s) => ({
          counters,
          topology: {
            ...s.topology,
            devices: [...s.topology.devices, device],
          },
        }));
      },

      updateDevice: (id, patch) =>
        set((s) => ({
          topology: {
            ...s.topology,
            devices: s.topology.devices.map((d) =>
              d.id === id ? { ...d, ...patch } : d,
            ),
          },
        })),

      removeDevice: (id) =>
        set((s) => ({
          topology: {
            ...s.topology,
            devices: s.topology.devices.filter((d) => d.id !== id),
            links: s.topology.links.filter(
              (l) => l.from.deviceId !== id && l.to.deviceId !== id,
            ),
          },
          selectedDeviceId:
            s.selectedDeviceId === id ? null : s.selectedDeviceId,
        })),

      addLink: (from, to) => {
        const { topology } = get();
        if (from.deviceId === to.deviceId) return null;
        if (findLinkOnPort(topology, from) || findLinkOnPort(topology, to)) {
          return null;
        }
        const id = `link-${crypto.randomUUID()}`;
        const link = {
          id,
          from,
          to,
          cableType: "copper-straight" as const,
          createdAt: Date.now(),
        };
        set((s) => ({
          topology: { ...s.topology, links: [...s.topology.links, link] },
          cablePending: null,
      portPickerDeviceId: null,
          toolMode: "select",
        }));
        return id;
      },

      removeLink: (id) =>
        set((s) => ({
          topology: {
            ...s.topology,
            links: s.topology.links.filter((l) => l.id !== id),
          },
        })),

      setTopology: (t) => set({ topology: t }),

      setSimEvents: (events) => set({ simEvents: events }),

      pushSimEvents: (events) =>
        set((s) => ({ simEvents: [...s.simEvents, ...events] })),

      clearSimEvents: () => set({ simEvents: [] }),

      setLastValidation: (v) => set({ lastValidation: v }),
    }),
    {
      name: "campus-network-topology",
      partialize: (s) => ({
        topology: s.topology,
        counters: s.counters,
      }),
    },
  ),
);
