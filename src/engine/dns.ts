import { forwardIcmp } from "./forwarding";
import { getDevice } from "./l2";
import type { Device, Topology } from "./types";

export function resolveDnsFromServer(
  topology: Topology,
  dnsServer: Device,
  hostname: string,
): string | null {
  if (dnsServer.kind !== "server" || !dnsServer.server?.services.dns.enabled) {
    return null;
  }
  const records = dnsServer.server.services.dns.records;
  const lower = hostname.toLowerCase().replace(/\.$/, "");
  for (const r of records) {
    if (r.type === "A" && r.domainName.toLowerCase() === lower) {
      return r.ipAddress;
    }
  }
  return null;
}

export function nslookup(
  topology: Topology,
  pcDeviceId: string,
  hostname: string,
): { lines: string[]; address?: string } {
  const pc = getDevice(topology, pcDeviceId);
  const lines: string[] = [];
  if (!pc?.pc) {
    return { lines: ["Invalid host."] };
  }
  const dns = pc.pc.interface.dnsServer;
  if (!dns) {
    lines.push("*** Can't find server address for DNS");
    return { lines };
  }

  let dnsServer: Device | undefined;
  for (const d of topology.devices) {
    if (d.kind === "server" && d.server?.interface.ip === dns) {
      dnsServer = d;
      break;
    }
  }

  if (!dnsServer) {
    lines.push(`*** Can't find server name for address ${dns}: Non-existent domain`);
    return { lines };
  }

  const addr = resolveDnsFromServer(topology, dnsServer, hostname);
  if (!addr) {
    lines.push(`*** ${hostname}: Non-existent domain`);
    return { lines };
  }

  const reach = forwardIcmp(topology, pcDeviceId, addr);
  if (!reach.success) {
    lines.push(`Name:    ${hostname}`);
    lines.push(`Address: ${addr}`);
    lines.push("(Host unreachable for resolved address)");
    return { lines, address: addr };
  }

  lines.push(`Name:    ${hostname}`);
  lines.push(`Address: ${addr}`);
  return { lines, address: addr };
}
