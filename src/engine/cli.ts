import { assignDhcp, releaseDhcp, ensurePcNetwork } from "./dhcp";
import { nslookup } from "./dns";
import { httpGet } from "./http";
import { forwardIcmp, ping } from "./forwarding";
import { getDevice } from "./l2";
import { buildRoutingTable } from "./routing";
import type { SimulateAction, Topology } from "./types";

export interface CliResult {
  output: string;
  topology?: Topology;
  traces?: import("./types").ForwardResult[];
}

export function runSimulateAction(
  topology: Topology,
  action: SimulateAction,
): CliResult {
  switch (action.type) {
    case "ping": {
      const top = ensurePcNetwork(topology, action.deviceId);
      const { lines, traces } = ping(top, action.deviceId, action.target, action.count ?? 4);
      return { output: lines.join("\r\n"), topology: top, traces };
    }
    case "nslookup": {
      const top = ensurePcNetwork(topology, action.deviceId);
      const res = nslookup(top, action.deviceId, action.hostname);
      return {
        output: res.lines.join("\r\n"),
        topology: top,
        traces: res.trace ? [res.trace] : [],
      };
    }
    case "http": {
      const top = ensurePcNetwork(topology, action.deviceId);
      const res = httpGet(top, action.deviceId, action.url);
      if (!res.ok) {
        return {
          output: res.error ?? "Error",
          topology: top,
          traces: res.trace ? [res.trace] : [],
        };
      }
      return {
        output: res.html ?? "",
        topology: top,
        traces: res.trace ? [res.trace] : [],
      };
    }
    case "cli":
      return runPcCli(topology, action.deviceId, action.command);
    case "dhcp-renew": {
      const { topology: top, lines } = assignDhcp(topology, action.deviceId);
      return { output: lines.join("\r\n"), topology: top };
    }
    case "dhcp-release": {
      const top = releaseDhcp(topology, action.deviceId);
      return { output: "DHCP lease released.", topology: top };
    }
    case "router-cli":
      return runRouterCli(topology, action.deviceId, action.command);
    default:
      return { output: "Unknown action" };
  }
}

function runPcCli(topology: Topology, deviceId: string, command: string): CliResult {
  const trimmed = command.trim();
  const lower = trimmed.toLowerCase();
  let top = topology;

  if (lower === "help") {
    return {
      output: [
        "Supported commands:",
        "  ipconfig",
        "  ipconfig /all",
        "  ipconfig /renew",
        "  ipconfig /release",
        "  ping <host>",
        "  nslookup <name>",
        "  tracert <host>",
        "  cls",
        "  help",
      ].join("\r\n"),
    };
  }
  if (lower === "cls") return { output: "" };

  if (lower === "ipconfig" || lower === "ipconfig /all") {
    const pc = getDevice(top, deviceId);
    if (!pc?.pc) return { output: "Not a PC." };
    top = ensurePcNetwork(top, deviceId);
    const p = getDevice(top, deviceId)!;
    const iface = p.pc!.interface;
    const lines = [
      "Windows IP Configuration",
      "",
      `Ethernet adapter Local Area Connection:`,
      lower.includes("/all")
        ? `   Connection-specific DNS Suffix  . :`
        : "",
      `   IPv4 Address. . . . . . . . . . . : ${iface.ip ?? "0.0.0.0"}`,
      `   Subnet Mask . . . . . . . . . . . : ${iface.subnetMask ?? "0.0.0.0"}`,
      `   Default Gateway . . . . . . . . . : ${iface.defaultGateway ?? ""}`,
    ].filter(Boolean);
    if (lower.includes("/all")) {
      lines.push(`   DNS Servers . . . . . . . . . . : ${iface.dnsServer ?? ""}`);
      lines.push(`   DHCP Enabled. . . . . . . . . . : ${iface.mode === "dhcp" ? "Yes" : "No"}`);
    }
    return { output: lines.join("\r\n"), topology: top };
  }

  if (lower === "ipconfig /renew") {
    const res = assignDhcp(top, deviceId);
    return { output: res.lines.join("\r\n"), topology: res.topology };
  }
  if (lower === "ipconfig /release") {
    top = releaseDhcp(top, deviceId);
    return { output: "DHCP lease released.", topology: top };
  }

  if (lower.startsWith("ping ")) {
    const target = trimmed.slice(5).trim();
    top = ensurePcNetwork(top, deviceId);
    const { lines, traces } = ping(top, deviceId, target, 4);
    return { output: lines.join("\r\n"), topology: top, traces };
  }

  if (lower.startsWith("nslookup ")) {
    const host = trimmed.slice(9).trim();
    top = ensurePcNetwork(top, deviceId);
    const res = nslookup(top, deviceId, host);
    return { output: res.lines.join("\r\n"), topology: top, traces: res.trace ? [res.trace] : [] };
  }

  if (lower.startsWith("tracert ")) {
    const target = trimmed.slice(8).trim();
    top = ensurePcNetwork(top, deviceId);
    const lines = [`Tracing route to ${target}`, ""];
    const fwd = forwardIcmp(top, deviceId, target);
    fwd.forwardTrace.forEach((h, i) => {
      lines.push(`  ${i + 1}    ${h.deviceName}  ${h.action}`);
    });
    if (fwd.success) lines.push("Trace complete.");
    else lines.push(fwd.message ?? "Trace failed.");
    return { output: lines.join("\r\n"), topology: top, traces: [fwd] };
  }

  return { output: `Unknown command: ${trimmed}` };
}

function runRouterCli(topology: Topology, deviceId: string, command: string): CliResult {
  const router = getDevice(topology, deviceId);
  if (!router?.router) return { output: "Not a router." };
  const trimmed = command.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "show ip interface brief") {
    const lines = ["Interface              IP-Address      OK? Method Status"];
    for (const [ifId, cfg] of Object.entries(router.router.interfaces)) {
      lines.push(
        `${ifId.padEnd(22)} ${(cfg.ip ?? "unassigned").padEnd(15)} YES manual ${cfg.status === "on" ? "up" : "down"}`,
      );
    }
    return { output: lines.join("\r\n") };
  }

  if (lower === "show ip route") {
    const routes = buildRoutingTable(router);
    const lines = ["Codes: C - connected"];
    for (const r of routes) {
      lines.push(`C    ${r.network}/${r.prefix} is directly connected, ${r.outInterface}`);
    }
    if (router.router.ospf.enabled) {
      lines.push(`O    OSPF process ${router.router.ospf.processId} enabled (single-router: no learned routes)`);
    }
    return { output: lines.join("\r\n") };
  }

  if (lower === "show ip protocols") {
    const o = router.router.ospf;
    if (!o.enabled) return { output: "Routing Protocol is not enabled" };
    const lines = [
      `Routing Protocol is "ospf ${o.processId}"`,
      "  Routing for Networks:",
    ];
    for (const n of o.networks) {
      lines.push(`    ${n.networkAddress} ${n.wildcardMask} area ${n.areaId}`);
    }
    return { output: lines.join("\r\n") };
  }

  if (lower === "show class-map") {
    const lines: string[] = [];
    for (const cm of router.router.qos.classMaps) {
      lines.push(`Class Map match-all ${cm.name}`);
      for (const m of cm.matchRules) {
        if (m.protocol === "any") lines.push("  Match any");
        else lines.push(`  Match ${m.protocol} port ${m.port ?? "*"}`);
      }
    }
    return { output: lines.join("\r\n") || "No class maps" };
  }

  if (lower === "show policy-map") {
    const lines: string[] = [];
    for (const pm of router.router.qos.policyMaps) {
      lines.push(`Policy Map ${pm.name}`);
      for (const c of pm.classes) {
        lines.push(
          `  Class ${c.classMapName}: priority ${c.priorityLevel}, bandwidth ${c.bandwidthPercent}%`,
        );
      }
    }
    return { output: lines.join("\r\n") || "No policy maps" };
  }

  if (lower === "show policy-map interface") {
    const lines: string[] = [];
    for (const sp of router.router.qos.servicePolicies) {
      lines.push(
        `${sp.interfacePortId} ${sp.direction}: ${sp.policyMapName}`,
      );
    }
    return { output: lines.join("\r\n") || "No service policies applied" };
  }

  if (lower.startsWith("show running-config")) {
    const lines = [`hostname ${router.name}`, "interface GigabitEthernet0/0"];
    return { output: lines.join("\r\n") + "\r\n..." };
  }

  return { output: `Unknown command: ${trimmed}` };
}
