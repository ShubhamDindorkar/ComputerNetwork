import { getPortsForDevice } from "./catalog";
import { sameSubnet } from "./ip";
import {
  broadcastDomain,
  findHostGateway,
  findHostIp,
  findHostMask,
  findLinkOnPort,
  getDevice,
  isLinkUp,
  otherEnd,
} from "./l2";
import { buildRoutingTable, longestPrefixMatch } from "./routing";
import type { ForwardResult, Topology, TraceHop } from "./types";

function hop(
  deviceId: string,
  deviceName: string,
  action: string,
  inPort?: string,
  outPort?: string,
): TraceHop {
  return { deviceId, deviceName, action, inPort, outPort };
}

function findDeviceByIpInDomain(
  topology: Topology,
  domainDeviceIds: Set<string>,
  ip: string,
): import("./types").Device | undefined {
  for (const id of domainDeviceIds) {
    const d = getDevice(topology, id);
    if (!d) continue;
    const hostIp = findHostIp(d);
    if (hostIp === ip) return d;
    if (d.kind === "router" && d.router) {
      for (const cfg of Object.values(d.router.interfaces)) {
        if (cfg.ip === ip) return d;
      }
    }
  }
  return undefined;
}

function nextHopFromHost(
  topology: Topology,
  host: import("./types").Device,
  destIp: string,
): { nextDeviceId: string; outPort: string; viaGateway: boolean } | null {
  const ip = findHostIp(host);
  const mask = findHostMask(host);
  const gw = findHostGateway(host);
  if (!ip || !mask) return null;

  const hostPort = getPortsForDevice(host)[0]?.id ?? "Fa0";
  const link = findLinkOnPort(topology, { deviceId: host.id, portId: hostPort });
  if (!link || !isLinkUp(topology, link)) return null;
  const neighbor = otherEnd(link, { deviceId: host.id, portId: hostPort });

  if (sameSubnet(ip, destIp, mask)) {
    return { nextDeviceId: neighbor.deviceId, outPort: hostPort, viaGateway: false };
  }
  if (!gw) return null;
  const gwInDomain = broadcastDomain(topology, { deviceId: host.id, portId: hostPort });
  const gwDev = findDeviceByIpInDomain(topology, gwInDomain, gw);
  if (gwDev) {
    if (gwDev.id === neighbor.deviceId) {
      return { nextDeviceId: neighbor.deviceId, outPort: hostPort, viaGateway: true };
    }
  }
  return { nextDeviceId: neighbor.deviceId, outPort: hostPort, viaGateway: true };
}

export function forwardIcmp(
  topology: Topology,
  srcDeviceId: string,
  destIp: string,
): ForwardResult {
  const src = getDevice(topology, srcDeviceId);
  if (!src) {
    return { success: false, message: "Unknown source device", forwardTrace: [] };
  }
  const trace: TraceHop[] = [];
  let current = src;
  let currentInPort: string | undefined;
  let routerHops = 0;
  const visited = new Set<string>();

  for (let step = 0; step < 32; step++) {
    if (visited.has(current.id)) {
      return {
        success: false,
        message: "Routing loop detected",
        forwardTrace: trace,
      };
    }
    visited.add(current.id);

    if (current.kind === "pc" || current.kind === "server") {
      const destHostIp = findHostIp(current);
      if (destHostIp === destIp) {
        trace.push(
          hop(current.id, current.name, "Delivered to local host", currentInPort),
        );
        return {
          success: true,
          forwardTrace: trace,
          rttMs: 1 + routerHops,
          ttl: 128 - routerHops,
        };
      }
      const nh = nextHopFromHost(topology, current, destIp);
      if (!nh) {
        return {
          success: false,
          message: "Destination host unreachable",
          forwardTrace: trace,
        };
      }
      trace.push(
        hop(
          current.id,
          current.name,
          nh.viaGateway ? "Forward via gateway" : "Forward on LAN",
          currentInPort,
          nh.outPort,
        ),
      );
      current = getDevice(topology, nh.nextDeviceId)!;
      currentInPort = undefined;
      continue;
    }

    if (current.kind === "switch") {
      const ports = getPortsForDevice(current);
      let forwarded = false;

      // 1. Direct host or router interface match on this switch
      for (const p of ports) {
        const ref = { deviceId: current.id, portId: p.id };
        const link = findLinkOnPort(topology, ref);
        if (!link || !isLinkUp(topology, link)) continue;
        const neighbor = otherEnd(link, ref);
        const nDev = getDevice(topology, neighbor.deviceId);
        if (!nDev || nDev.kind === "switch") continue;

        const nIp = findHostIp(nDev);
        if (nIp && nIp === destIp) {
          trace.push(
            hop(current.id, current.name, `Switch forward to host (${p.id})`, currentInPort, p.id),
          );
          current = nDev;
          currentInPort = neighbor.portId;
          forwarded = true;
          break;
        }

        if (nDev.kind === "router" && nDev.router) {
          const directMatch = Object.values(nDev.router.interfaces).some(
            (c) => c.status !== "off" && c.ip === destIp,
          );
          if (directMatch) {
            trace.push(
              hop(current.id, current.name, `Switch forward to router (${p.id})`, currentInPort, p.id),
            );
            current = nDev;
            currentInPort = neighbor.portId;
            forwarded = true;
            break;
          }
        }
      }

      // 2. Check if destIp is reachable through an interconnected switch
      if (!forwarded) {
        for (const p of ports) {
          const ref = { deviceId: current.id, portId: p.id };
          const link = findLinkOnPort(topology, ref);
          if (!link || !isLinkUp(topology, link)) continue;
          const neighbor = otherEnd(link, ref);
          const nDev = getDevice(topology, neighbor.deviceId);
          if (nDev?.kind === "switch") {
            const domain = broadcastDomain(topology, neighbor);
            const devInDomain = findDeviceByIpInDomain(topology, domain, destIp);
            if (devInDomain) {
              trace.push(
                hop(current.id, current.name, `Switch forward to switch (${p.id})`, currentInPort, p.id),
              );
              current = nDev;
              currentInPort = neighbor.portId;
              forwarded = true;
              break;
            }
          }
        }
      }

      // 3. Fallback: Destination is off-subnet or routed — forward to connected router
      if (!forwarded) {
        for (const p of ports) {
          const ref = { deviceId: current.id, portId: p.id };
          const link = findLinkOnPort(topology, ref);
          if (!link || !isLinkUp(topology, link)) continue;
          const neighbor = otherEnd(link, ref);
          const nDev = getDevice(topology, neighbor.deviceId);
          if (nDev?.kind === "router") {
            trace.push(
              hop(current.id, current.name, `Switch forward to gateway (${p.id})`, currentInPort, p.id),
            );
            current = nDev;
            currentInPort = neighbor.portId;
            forwarded = true;
            break;
          }
        }
      }

      if (!forwarded) {
        return {
          success: false,
          message: "No path through switch",
          forwardTrace: trace,
        };
      }
      continue;
    }

    if (current.kind === "router" && current.router) {
      routerHops++;

      // Check if destIp is one of this router's own interface IPs
      for (const [ifName, ifCfg] of Object.entries(current.router.interfaces)) {
        if (ifCfg.status !== "off" && ifCfg.ip === destIp) {
          trace.push(
            hop(
              current.id,
              current.name,
              `Delivered to router (${ifName}: ${destIp})`,
              currentInPort,
            ),
          );
          return {
            success: true,
            forwardTrace: trace,
            rttMs: 1 + routerHops,
            ttl: 255 - routerHops,
          };
        }
      }

      const routes = buildRoutingTable(current);
      const route = longestPrefixMatch(routes, destIp);
      if (!route) {
        const ifWithIp = Object.entries(current.router.interfaces).find(([, c]) => c.ip);
        const srcAddr = ifWithIp?.[1].ip ?? "?";
        return {
          success: false,
          message: `Destination host unreachable from ${srcAddr}`,
          forwardTrace: trace,
        };
      }
      const outIf = route.outInterface;
      const cfg = current.router.interfaces[outIf];
      if (!cfg?.ip || cfg.status === "off") {
        return {
          success: false,
          message: "Outgoing interface down",
          forwardTrace: trace,
        };
      }
      if (sameSubnet(cfg.ip, destIp, cfg.subnetMask!)) {
        const link = findLinkOnPort(topology, {
          deviceId: current.id,
          portId: outIf,
        });
        if (!link) {
          return {
            success: false,
            message: "No link on outgoing interface",
            forwardTrace: trace,
          };
        }
        const neighbor = otherEnd(link, { deviceId: current.id, portId: outIf });
        const nDev = getDevice(topology, neighbor.deviceId)!;
        trace.push(
          hop(
            current.id,
            current.name,
            `Route to ${destIp} via ${outIf}`,
            currentInPort,
            outIf,
          ),
        );
        current = nDev;
        currentInPort = neighbor.portId;
        continue;
      }
      return {
        success: false,
        message: "No route to host",
        forwardTrace: trace,
      };
    }

    return { success: false, message: "Unsupported device", forwardTrace: trace };
  }

  return { success: false, message: "TTL exceeded", forwardTrace: trace };
}

export function ping(
  topology: Topology,
  srcDeviceId: string,
  target: string,
  count = 4,
): { lines: string[]; traces: ForwardResult[] } {
  const src = getDevice(topology, srcDeviceId);
  const lines: string[] = [];
  const traces: ForwardResult[] = [];
  if (!src) {
    lines.push("Invalid source.");
    return { lines, traces };
  }
  lines.push(`Pinging ${target} with 32 bytes of data:`);
  let received = 0;
  let min = Infinity;
  let max = 0;
  let sum = 0;

  for (let i = 0; i < count; i++) {
    const fwd = forwardIcmp(topology, srcDeviceId, target);
    traces.push(fwd);
    if (fwd.success) {
      const rtt = fwd.rttMs ?? 10;
      received++;
      min = Math.min(min, rtt);
      max = Math.max(max, rtt);
      sum += rtt;
      lines.push(`Reply from ${target}: bytes=32 time=${rtt}ms TTL=${fwd.ttl ?? 64}`);
    } else {
      lines.push(`Request timed out.`);
    }
  }
  lines.push("");
  lines.push(`Ping statistics for ${target}:`);
  lines.push(`  Packets: Sent = ${count}, Received = ${received}, Lost = ${count - received} (${Math.round(((count - received) / count) * 100)}% loss)`);
  if (received > 0) {
    lines.push(`Approximate round trip times in milli-seconds:`);
    lines.push(`  Minimum = ${min}ms, Maximum = ${max}ms, Average = ${Math.round(sum / received)}ms`);
  }
  return { lines, traces };
}
