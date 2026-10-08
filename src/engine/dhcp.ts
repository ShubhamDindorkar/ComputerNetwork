import { getPortsForDevice } from "./catalog";
import { ipInRange, nextIp, randomApipa, sameSubnet } from "./ip";
import { broadcastDomain, findHostIp, getDevice } from "./l2";
import type { Device, Topology } from "./types";

function collectUsedIps(topology: Topology, subnetMask: string, gateway: string): Set<string> {
  const used = new Set<string>();
  used.add(gateway);
  for (const d of topology.devices) {
    const ip = findHostIp(d);
    if (ip) used.add(ip);
    if (d.kind === "router" && d.router) {
      for (const cfg of Object.values(d.router.interfaces)) {
        if (cfg.ip) used.add(cfg.ip);
      }
    }
  }
  for (const lease of Object.values(topology.dhcpLeases)) {
    used.add(lease.ip);
  }
  return used;
}

export function assignDhcp(
  topology: Topology,
  pcDeviceId: string,
): { topology: Topology; lines: string[]; success: boolean } {
  const pc = getDevice(topology, pcDeviceId);
  const lines: string[] = [];
  if (!pc || pc.kind !== "pc" || !pc.pc) {
    return { topology, lines: ["Not a PC."], success: false };
  }

  const portId = getPortsForDevice(pc)[0]?.id ?? "Fa0";
  const domain = broadcastDomain(topology, { deviceId: pc.id, portId });

  const servers: Device[] = [];
  for (const id of domain) {
    const d = getDevice(topology, id);
    if (d?.kind === "server" && d.server?.services.dhcp.enabled) {
      servers.push(d);
    }
  }

  if (servers.length === 0) {
    const apipa = randomApipa();
    const updated = topology.devices.map((d) => {
      if (d.id !== pcDeviceId || !d.pc) return d;
      return {
        ...d,
        pc: {
          ...d.pc,
          interface: {
            ...d.pc.interface,
            mode: "dhcp" as const,
            ip: apipa,
            subnetMask: "255.255.255.0",
            defaultGateway: undefined,
            dnsServer: undefined,
          },
        },
      };
    });
    lines.push("DHCP request failed. APIPA is being used.");
    lines.push(`Assigned APIPA address ${apipa}`);
    return {
      topology: { ...topology, devices: updated },
      lines,
      success: false,
    };
  }

  const server = servers[0];
  const pools = server.server!.services.dhcp.pools;
  const serverIp = server.server!.interface.ip;
  let chosenPool = pools.find((p) =>
    serverIp && sameSubnet(serverIp, p.defaultGateway, p.subnetMask),
  );
  if (!chosenPool && pools.length) chosenPool = pools[0];
  if (!chosenPool) {
    lines.push("DHCP server has no pools configured.");
    return { topology, lines, success: false };
  }

  const used = collectUsedIps(topology, chosenPool.subnetMask, chosenPool.defaultGateway);
  let candidate = chosenPool.startIp;
  let assigned: string | null = null;
  for (let i = 0; i < 200; i++) {
    if (!ipInRange(candidate, chosenPool.startIp, chosenPool.endIp)) break;
    if (!used.has(candidate)) {
      assigned = candidate;
      break;
    }
    const n = nextIp(candidate);
    if (!n) break;
    candidate = n;
  }

  if (!assigned) {
    lines.push("DHCP pool exhausted.");
    return { topology, lines, success: false };
  }

  const updatedDevices = topology.devices.map((d) => {
    if (d.id !== pcDeviceId || !d.pc) return d;
    return {
      ...d,
      pc: {
        ...d.pc,
        interface: {
          ...d.pc.interface,
          mode: "dhcp" as const,
          ip: assigned!,
          subnetMask: chosenPool!.subnetMask,
          defaultGateway: chosenPool!.defaultGateway,
          dnsServer: chosenPool!.dnsServer,
        },
        lease: { serverId: server.id, poolName: chosenPool!.name },
      },
    };
  });

  const leases = {
    ...topology.dhcpLeases,
    [pcDeviceId]: { ip: assigned, deviceId: pcDeviceId, poolName: chosenPool.name },
  };

  lines.push(`DHCP assigned ${assigned}`);
  lines.push(`  Subnet Mask: ${chosenPool.subnetMask}`);
  lines.push(`  Default Gateway: ${chosenPool.defaultGateway}`);
  lines.push(`  DNS Server: ${chosenPool.dnsServer}`);

  return {
    topology: { ...topology, devices: updatedDevices, dhcpLeases: leases },
    success: true,
    lines,
  };
}

export function releaseDhcp(topology: Topology, pcDeviceId: string): Topology {
  const leases = { ...topology.dhcpLeases };
  delete leases[pcDeviceId];
  const updatedDevices = topology.devices.map((d) => {
    if (d.id !== pcDeviceId || !d.pc) return d;
    return {
      ...d,
      pc: {
        ...d.pc,
        interface: {
          ...d.pc.interface,
          ip: undefined,
          subnetMask: undefined,
          defaultGateway: undefined,
          dnsServer: undefined,
        },
        lease: undefined,
      },
    };
  });
  return { ...topology, devices: updatedDevices, dhcpLeases: leases };
}

export function ensurePcNetwork(topology: Topology, pcDeviceId: string): Topology {
  const pc = getDevice(topology, pcDeviceId);
  if (!pc?.pc) return topology;
  if (pc.pc.interface.mode === "dhcp" && !pc.pc.interface.ip) {
    return assignDhcp(topology, pcDeviceId).topology;
  }
  return topology;
}
