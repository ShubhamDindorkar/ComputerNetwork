import { parseIpv4 } from "./ip";
import { nslookup } from "./dns";
import { forwardIcmp } from "./forwarding";
import { findHostIp } from "./l2";
import type { Topology } from "./types";

function isIpv4Host(s: string): boolean {
  return parseIpv4(s) !== null;
}

export function httpGet(
  topology: Topology,
  pcDeviceId: string,
  url: string,
): { ok: boolean; html?: string; error?: string; resolvedIp?: string; trace?: import("./types").ForwardResult } {
  let host = url.trim();
  if (host.startsWith("http://")) host = host.slice(7);
  if (host.startsWith("https://")) host = host.slice(8);
  const slash = host.indexOf("/");
  if (slash >= 0) host = host.slice(0, slash);

  let targetIp: string | undefined;
  if (isIpv4Host(host)) {
    targetIp = host;
  } else {
    const lookup = nslookup(topology, pcDeviceId, host);
    if (!lookup.address) {
      return { ok: false, error: "Host Name Unresolved" };
    }
    targetIp = lookup.address;
  }

  const reach = forwardIcmp(topology, pcDeviceId, targetIp);
  if (!reach.success) {
    return { ok: false, error: "Request Timeout", resolvedIp: targetIp, trace: reach };
  }

  const webServer = topology.devices.find(
    (d) =>
      d.kind === "server" &&
      d.server?.services.http.enabled &&
      findHostIp(d) === targetIp,
  );

  if (!webServer?.server) {
    return { ok: false, error: "Request Timeout", resolvedIp: targetIp, trace: reach };
  }

  return {
    ok: true,
    html: webServer.server.services.http.indexHtml,
    resolvedIp: targetIp,
    trace: reach,
  };
}
