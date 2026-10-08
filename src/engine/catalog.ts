import type { DeviceKind, DeviceModel, PortDef } from "./types";

export const DEVICE_CATALOG: Record<
  DeviceModel,
  { kind: DeviceKind; label: string; ports: PortDef[] }
> = {
  "cisco-2911": {
    kind: "router",
    label: "Cisco 2911",
    ports: [
      { id: "Gi0/0", label: "GigabitEthernet0/0", type: "gigabit" },
      { id: "Gi0/1", label: "GigabitEthernet0/1", type: "gigabit" },
      { id: "Gi0/2", label: "GigabitEthernet0/2", type: "gigabit" },
    ],
  },
  "catalyst-2960-24tt": {
    kind: "switch",
    label: "Catalyst 2960-24TT",
    ports: [
      ...Array.from({ length: 24 }, (_, i) => ({
        id: `Fa0/${i + 1}`,
        label: `FastEthernet0/${i + 1}`,
        type: "fast" as const,
      })),
      { id: "Gi0/1", label: "GigabitEthernet0/1", type: "gigabit" },
      { id: "Gi0/2", label: "GigabitEthernet0/2", type: "gigabit" },
    ],
  },
  server: {
    kind: "server",
    label: "Generic Server",
    ports: [{ id: "Gi0", label: "GigabitEthernet0", type: "gigabit" }],
  },
  pc: {
    kind: "pc",
    label: "Generic PC",
    ports: [{ id: "Fa0", label: "FastEthernet0", type: "fast" }],
  },
};

export function defaultRouterConfig(): import("./types").RouterConfig {
  const interfaces: Record<string, import("./types").InterfaceConfig> = {};
  for (const p of DEVICE_CATALOG["cisco-2911"].ports) {
    interfaces[p.id] = { status: "on" };
  }
  return {
    interfaces,
    ospf: { enabled: false, processId: 1, networks: [] },
    qos: { classMaps: [], policyMaps: [], servicePolicies: [] },
  };
}

export function defaultServerConfig(): import("./types").ServerConfig {
  return {
    interface: { status: "on" },
    services: {
      dhcp: { enabled: false, pools: [] },
      dns: { enabled: false, records: [] },
      http: {
        enabled: false,
        port: 80,
        indexHtml: "<html><body><h1>Campus Web Server</h1><p>HTTP service is running.</p></body></html>",
      },
    },
  };
}

export function defaultPcConfig(): import("./types").PcConfig {
  return {
    interface: { mode: "dhcp", status: "on" },
  };
}

export function createDevice(
  model: DeviceModel,
  id: string,
  name: string,
  position: { x: number; y: number },
): import("./types").Device {
  const meta = DEVICE_CATALOG[model];
  const device: import("./types").Device = {
    id,
    kind: meta.kind,
    model,
    name,
    position,
  };
  if (meta.kind === "router") device.router = defaultRouterConfig();
  if (meta.kind === "server") device.server = defaultServerConfig();
  if (meta.kind === "pc") device.pc = defaultPcConfig();
  return device;
}

export function getPortsForDevice(device: import("./types").Device): PortDef[] {
  return DEVICE_CATALOG[device.model].ports;
}
