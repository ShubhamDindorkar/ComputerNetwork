import type {
  SimulateAction,
  Topology,
  ValidationResult,
} from "@/engine/types";

export async function fetchPresets() {
  const res = await fetch("/api/presets");
  return res.json() as Promise<
    { id: string; name: string; description: string }[]
  >;
}

export async function fetchPreset(id: string) {
  const res = await fetch(`/api/presets/${id}`);
  if (!res.ok) throw new Error("Preset not found");
  return res.json() as Promise<Topology>;
}

export async function simulate(topology: Topology, action: SimulateAction) {
  const res = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topology, action }),
  });
  return res.json() as Promise<{
    output: string;
    topology?: Topology;
    traces?: unknown[];
  }>;
}

export async function validateTopology(topology: Topology) {
  const res = await fetch("/api/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topology }),
  });
  return res.json() as Promise<ValidationResult>;
}

export async function runQosApi(
  topology: Topology,
  deviceId: string,
  interfacePortId: string,
) {
  const res = await fetch("/api/qos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topology, deviceId, interfacePortId }),
  });
  return res.json();
}

export async function generateReport(
  topology: Topology,
  validation: ValidationResult,
) {
  const res = await fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topology, validation }),
  });
  return res.json() as Promise<{ markdown: string }>;
}
