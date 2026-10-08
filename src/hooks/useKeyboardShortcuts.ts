"use client";

import { useEffect } from "react";
import { useTopologyStore } from "@/store/topologyStore";

export function useKeyboardShortcuts() {
  const selectedDeviceId = useTopologyStore((s) => s.selectedDeviceId);
  const removeDevice = useTopologyStore((s) => s.removeDevice);
  const topology = useTopologyStore((s) => s.topology);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedDeviceId) {
        removeDevice(selectedDeviceId);
      }
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        const blob = new Blob([JSON.stringify(topology, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${topology.name || "project"}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedDeviceId, removeDevice, topology]);
}
