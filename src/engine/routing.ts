import { maskToPrefix, networkAddress, parseIpv4 } from "./ip";
import type { Device, Topology } from "./types";

export interface RouteEntry {
  network: string;
  prefix: number;
  mask: string;
  nextHop?: string;
  outInterface: string;
  type: "connected" | "ospf";
}

export function getRouterInterfaceRoutes(device: Device): RouteEntry[] {
  if (device.kind !== "router" || !device.router) return [];
  const routes: RouteEntry[] = [];
  for (const [ifName, cfg] of Object.entries(device.router.interfaces)) {
    if (cfg.status === "off" || !cfg.ip || !cfg.subnetMask) continue;
    const prefix = maskToPrefix(cfg.subnetMask);
    if (prefix === null) continue;
    const net = networkAddress(cfg.ip, cfg.subnetMask);
    if (!net) continue;
    routes.push({
      network: net,
      prefix,
      mask: cfg.subnetMask,
      outInterface: ifName,
      type: "connected",
    });
  }
  return routes;
}

export function buildRoutingTable(device: Device): RouteEntry[] {
  return getRouterInterfaceRoutes(device);
}

export function longestPrefixMatch(
  routes: RouteEntry[],
  destIp: string,
): RouteEntry | undefined {
  const d = parseIpv4(destIp);
  if (d === null) return undefined;
  let best: RouteEntry | undefined;
  for (const r of routes) {
    const n = parseIpv4(r.network);
    if (n === null) continue;
    const mask = (0xffffffff << (32 - r.prefix)) >>> 0;
    if ((d & mask) === (n & mask)) {
      if (!best || r.prefix > best.prefix) best = r;
    }
  }
  return best;
}

export function findGatewayRouterForIp(
  topology: Topology,
  gatewayIp: string,
): { device: Device; interfaceId: string } | undefined {
  for (const d of topology.devices) {
    if (d.kind !== "router" || !d.router) continue;
    for (const [ifId, cfg] of Object.entries(d.router.interfaces)) {
      if (cfg.ip === gatewayIp && cfg.status !== "off") {
        return { device: d, interfaceId: ifId };
      }
    }
  }
  return undefined;
}
