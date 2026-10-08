import { getPortsForDevice } from "./catalog";
import type { Device, Link, PortRef, Topology } from "./types";

export function findLinkOnPort(
  topology: Topology,
  port: PortRef,
): Link | undefined {
  return topology.links.find(
    (l) =>
      (l.from.deviceId === port.deviceId && l.from.portId === port.portId) ||
      (l.to.deviceId === port.deviceId && l.to.portId === port.portId),
  );
}

export function otherEnd(link: Link, port: PortRef): PortRef {
  if (link.from.deviceId === port.deviceId && link.from.portId === port.portId) {
    return link.to;
  }
  return link.from;
}

export function portStatusOn(device: Device, portId: string): boolean {
  if (device.kind === "router" && device.router) {
    return device.router.interfaces[portId]?.status !== "off";
  }
  if (device.kind === "server" && device.server) {
    return device.server.interface.status !== "off";
  }
  if (device.kind === "pc" && device.pc) {
    return device.pc.interface.status !== "off";
  }
  if (device.kind === "switch") return true;
  return false;
}

export function isLinkUp(topology: Topology, link: Link): boolean {
  const devA = topology.devices.find((d) => d.id === link.from.deviceId);
  const devB = topology.devices.find((d) => d.id === link.to.deviceId);
  if (!devA || !devB) return false;
  return (
    portStatusOn(devA, link.from.portId) && portStatusOn(devB, link.to.portId)
  );
}

export function getDevice(topology: Topology, id: string): Device | undefined {
  return topology.devices.find((d) => d.id === id);
}

export function getConnectedPorts(
  topology: Topology,
  deviceId: string,
): PortRef[] {
  const device = getDevice(topology, deviceId);
  if (!device) return [];
  const ports = getPortsForDevice(device);
  const refs: PortRef[] = [];
  for (const p of ports) {
    const link = findLinkOnPort(topology, { deviceId, portId: p.id });
    if (link && isLinkUp(topology, link)) {
      refs.push({ deviceId, portId: p.id });
    }
  }
  return refs;
}

/** BFS through switches; stops at routers and end hosts */
export function broadcastDomain(
  topology: Topology,
  start: PortRef,
): Set<string> {
  const visitedDevices = new Set<string>();
  const queue: PortRef[] = [start];
  const startDev = getDevice(topology, start.deviceId);
  if (!startDev) return visitedDevices;

  while (queue.length) {
    const current = queue.shift()!;
    const dev = getDevice(topology, current.deviceId);
    if (!dev) continue;

    if (dev.kind === "switch") {
      if (visitedDevices.has(dev.id)) continue;
      visitedDevices.add(dev.id);
      for (const p of getPortsForDevice(dev)) {
        const ref = { deviceId: dev.id, portId: p.id };
        const link = findLinkOnPort(topology, ref);
        if (!link || !isLinkUp(topology, link)) continue;
        const neighbor = otherEnd(link, ref);
        const nDev = getDevice(topology, neighbor.deviceId);
        if (!nDev) continue;
        if (nDev.kind === "switch") {
          queue.push(neighbor);
        } else {
          visitedDevices.add(nDev.id);
        }
      }
    } else {
      visitedDevices.add(dev.id);
      for (const p of getConnectedPorts(topology, dev.id)) {
        const link = findLinkOnPort(topology, p);
        if (!link) continue;
        const neighbor = otherEnd(link, p);
        const nDev = getDevice(topology, neighbor.deviceId);
        if (nDev?.kind === "switch") {
          queue.push(neighbor);
        } else if (nDev) {
          visitedDevices.add(nDev.id);
        }
      }
    }
  }
  return visitedDevices;
}

export function findHostIp(device: Device): string | undefined {
  if (device.kind === "server" && device.server?.interface.ip) {
    return device.server.interface.ip;
  }
  if (device.kind === "pc" && device.pc?.interface.ip) {
    return device.pc.interface.ip;
  }
  return undefined;
}

export function findHostMask(device: Device): string | undefined {
  if (device.kind === "server" && device.server?.interface.subnetMask) {
    return device.server.interface.subnetMask;
  }
  if (device.kind === "pc" && device.pc?.interface.subnetMask) {
    return device.pc.interface.subnetMask;
  }
  return undefined;
}

export function findHostGateway(device: Device): string | undefined {
  if (device.kind === "server" && device.server?.interface.defaultGateway) {
    return device.server.interface.defaultGateway;
  }
  if (device.kind === "pc" && device.pc?.interface.defaultGateway) {
    return device.pc.interface.defaultGateway;
  }
  return undefined;
}
