import type { ValidationResult, Topology } from "./types";

export function buildReportMarkdown(
  topology: Topology,
  validation: ValidationResult,
): string {
  const lines: string[] = [];
  lines.push("# Campus Network with QoS Implementation");
  lines.push("");
  lines.push("## Section 1: Introduction");
  lines.push("");
  lines.push(`**Project:** ${topology.name}`);
  lines.push("");
  lines.push("**Objective:** Design a campus network for two buildings with DHCP, DNS, web services, OSPF, and QoS traffic prioritization.");
  lines.push("");
  lines.push("**Tools:** Campus Network QoS Simulator (browser-based Packet Tracer-style lab)");
  lines.push("");
  lines.push("## Section 2: Network Architecture");
  lines.push("");
  lines.push("Hierarchical design: Core (Cisco 2911), Access (2× Catalyst 2960-24TT), End devices (6 PCs, 3 servers).");
  lines.push("");
  lines.push("## Section 3: IP Addressing & Subnetting");
  lines.push("");
  lines.push("| Device | IP | Mask | Gateway | DNS |");
  lines.push("|--------|-----|------|---------|-----|");
  for (const d of topology.devices) {
    if (d.router) {
      for (const [ifId, cfg] of Object.entries(d.router.interfaces)) {
        if (cfg.ip) {
          lines.push(`| ${d.name} ${ifId} | ${cfg.ip} | ${cfg.subnetMask ?? ""} | — | — |`);
        }
      }
    }
    if (d.server?.interface.ip) {
      lines.push(
        `| ${d.name} | ${d.server.interface.ip} | ${d.server.interface.subnetMask ?? ""} | ${d.server.interface.defaultGateway ?? ""} | — |`,
      );
    }
    if (d.pc?.interface.ip) {
      lines.push(
        `| ${d.name} | ${d.pc.interface.ip} | ${d.pc.interface.subnetMask ?? ""} | ${d.pc.interface.defaultGateway ?? ""} | ${d.pc.interface.dnsServer ?? ""} |`,
      );
    }
  }
  lines.push("");
  lines.push("## Section 4: Device Configuration");
  lines.push("");
  lines.push(`Total devices: ${topology.devices.length}, links: ${topology.links.length}`);
  lines.push("");
  lines.push("## Section 5: Services");
  lines.push("");
  const dhcp = topology.devices.find((d) => d.name === "DHCP-Server");
  if (dhcp?.server?.services.dhcp.pools[0]) {
    const p = dhcp.server.services.dhcp.pools[0];
    lines.push(`- **DHCP:** Pool ${p.name}, ${p.startIp}–${p.endIp}, gateway ${p.defaultGateway}`);
  }
  const dns = topology.devices.find((d) => d.name === "DNS-Server");
  if (dns?.server?.services.dns.records[0]) {
    const r = dns.server.services.dns.records[0];
    lines.push(`- **DNS:** ${r.domainName} → ${r.ipAddress}`);
  }
  lines.push("- **HTTP:** Web-Server on port 80, campus.local");
  lines.push("");
  lines.push("## Section 6: OSPF Routing");
  lines.push("");
  const rtr = topology.devices.find((d) => d.name === "Core-Router");
  if (rtr?.router?.ospf.enabled) {
    for (const n of rtr.router.ospf.networks) {
      lines.push(`- Network ${n.networkAddress} wildcard ${n.wildcardMask} area ${n.areaId}`);
    }
  }
  lines.push("");
  lines.push("## Section 7: QoS Implementation");
  lines.push("");
  if (rtr?.router) {
    for (const pm of rtr.router.qos.policyMaps) {
      lines.push(`**Policy:** ${pm.name}`);
      for (const c of pm.classes) {
        lines.push(`- ${c.classMapName}: priority ${c.priorityLevel}, ${c.bandwidthPercent}% bandwidth`);
      }
    }
  }
  lines.push("");
  lines.push("## Section 8: Testing & Verification");
  lines.push("");
  lines.push("| Test | Result |");
  lines.push("|------|--------|");
  for (const t of validation.tests) {
    lines.push(`| ${t.name} | ${t.pass ? "PASS" : "FAIL"} |`);
  }
  lines.push("");
  lines.push("### Checklist");
  for (const c of validation.checklist) {
    lines.push(`- [${c.pass ? "x" : " "}] (${c.part}) ${c.title}`);
  }
  lines.push("");
  lines.push("## Section 9: Conclusion");
  lines.push("");
  lines.push(
    validation.allPass
      ? "All objectives achieved. Network is operational."
      : "Some checklist items or tests failed. Review hints in the simulator checklist panel.",
  );
  return lines.join("\n");
}
