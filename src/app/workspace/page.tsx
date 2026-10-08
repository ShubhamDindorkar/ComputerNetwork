"use client";

import { TopBar } from "@/components/toolbar/TopBar";
import { DevicePalette } from "@/components/canvas/DevicePalette";
import { NetworkCanvas } from "@/components/canvas/NetworkCanvas";
import { InspectorPanel } from "@/components/inspector/InspectorPanel";
import { BottomPanel } from "@/components/simulation/BottomPanel";
import { PortPickerDialog } from "@/components/canvas/PortPickerDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function WorkspacePage() {
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <DevicePalette />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <NetworkCanvas />
          </div>
          <BottomPanel />
        </div>
        <InspectorPanel />
      </div>
      <PortPickerDialog />
    </div>
  );
}
