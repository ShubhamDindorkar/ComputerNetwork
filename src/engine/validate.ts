import { assignDhcp } from "./dhcp";
import { runSimulateAction } from "./cli";
import { campusQoSPreset } from "./presets/campusQoS";
import { findHostIp, getDevice } from "./l2";
import {
  avgDhcpDnsCompletion,
  avgDhcpDnsCompletionFifo,
  runQosComparison,
} from "./qos";
import type {
  ChecklistItem,
  FunctionalTestResult,
  Topology,
  ValidationResult,
} from "./types";

const EXPECTED_DEVICES: { name: string; model: string }[] = [
  { name: "Core-Router", model: "cisco-2911" },
  { name: "Switch-A", model: "catalyst-2960-24tt" },
  { name: "Switch-B", model: "catalyst-2960-24tt" },
  { name: "DHCP-Server", model: "server" },
  { name: "DNS-Server", model: "server" },
  { name: "Web-Server", model: "server" },
  { name: "PC-A1", model: "pc" },
  { name: "PC-A2", model: "pc" },
  { name: "PC-A3", model: "pc" },
  { name: "PC-B1", model: "pc" },
  { name: "PC-B2", model: "pc" },
  { name: "PC-B3", model: "pc" },
];

const EXPECTED_LINKS: {
  fromName: string;
  fromPort: string;
  toName: string;
  toPort: string;
}[] = [
  { fromName: "Core-Router", fromPort: "Gi0/0", toName: "Switch-A", toPort: "Gi0/1" },
  { fromName: "Core-Router", fromPort: "Gi0/1", toName: "Switch-B", toPort: "Gi0/1" },
  { fromName: "Core-Router", fromPort: "Gi0/2", toName: "Web-Server", toPort: "Gi0" },
  { fromName: "Switch-A", fromPort: "Fa0/2", toName: "DHCP-Server", toPort: "Gi0" },
  { fromName: "Switch-A", fromPort: "Fa0/3", toName: "DNS-Server", toPort: "Gi0" },
  { fromName: "Switch-A", fromPort: "Fa0/4", toName: "PC-A1", toPort: "Fa0" },
  { fromName: "Switch-A", fromPort: "Fa0/5", toName: "PC-A2", toPort: "Fa0" },
  { fromName: "Switch-A", fromPort: "Fa0/6", toName: "PC-A3", toPort: "Fa0" },
  { fromName: "Switch-B", fromPort: "Fa0/4", toName: "PC-B1", toPort: "Fa0" },
  { fromName: "Switch-B", fromPort: "Fa0/5", toName: "PC-B2", toPort: "Fa0" },
  { fromName: "Switch-B", fromPort: "Fa0/6", toName: "PC-B3", toPort: "Fa0" },
];

function byName(topology: Topology, name: string) {
  return topology.devices.find((d) => d.name === name);
}

function linkExists(topology: Topology, exp: (typeof EXPECTED_LINKS)[0]): boolean {
  const a = byName(topology, exp.fromName);
  const b = byName(topology, exp.toName);
  if (!a || !b) return false;
  return topology.links.some(
    (l) =>
      (l.from.deviceId === a.id &&
        l.from.portId === exp.fromPort &&
        l.to.deviceId === b.id &&
        l.to.portId === exp.toPort) ||
      (l.to.deviceId === a.id &&
        l.to.portId === exp.fromPort &&
        l.from.deviceId === b.id &&
        l.from.portId === exp.toPort),
  );
}

export function validateTopology(topology: Topology): ValidationResult {
  const checklist: ChecklistItem[] = [];

  checklist.push({
    id: "dev-count",
    part: "Part 3",
    title: "12 devices placed",
    pass: topology.devices.length === 12,
    hint: `Found ${topology.devices.length} devices, expected 12`,
  });

  for (const exp of EXPECTED_DEVICES) {
    const d = topology.devices.find(
      (x) => x.name === exp.name && x.model === exp.model,
    );
    checklist.push({
      id: `dev-${exp.name}`,
      part: "Part 3",
      title: `${exp.name} (${exp.model})`,
      pass: !!d,
      hint: d ? undefined : `Missing or wrong model for ${exp.name}`,
    });
  }

  checklist.push({
    id: "links-count",
    part: "Part 4",
    title: "11 copper connections",
    pass: topology.links.length === 11,
    hint: `Found ${topology.links.length} links`,
  });

  for (let i = 0; i < EXPECTED_LINKS.length; i++) {
    const exp = EXPECTED_LINKS[i];
    checklist.push({
      id: `link-${i + 1}`,
      part: "Part 4",
      title: `${exp.fromName} ${exp.fromPort} ↔ ${exp.toName} ${exp.toPort}`,
      pass: linkExists(topology, exp),
    });
  }

  const router = byName(topology, "Core-Router");
  if (router?.router) {
    const ifs = router.router.interfaces;
    checklist.push({
      id: "ip-router-gi0",
      part: "Part 5",
      title: "Core-Router Gi0/0 = 192.168.0.1/24",
      pass:
        ifs["Gi0/0"]?.ip === "192.168.0.1" &&
        ifs["Gi0/0"]?.subnetMask === "255.255.255.0",
    });
    checklist.push({
      id: "ip-router-gi1",
      part: "Part 5",
      title: "Core-Router Gi0/1 = 192.168.1.1/24",
      pass:
        ifs["Gi0/1"]?.ip === "192.168.1.1" &&
        ifs["Gi0/1"]?.subnetMask === "255.255.255.0",
    });
    checklist.push({
      id: "ip-router-gi2",
      part: "Part 5",
      title: "Core-Router Gi0/2 = 192.168.2.1/24",
      pass:
        ifs["Gi0/2"]?.ip === "192.168.2.1" &&
        ifs["Gi0/2"]?.subnetMask === "255.255.255.0",
    });
  }

  const dhcp = byName(topology, "DHCP-Server");
  checklist.push({
    id: "dhcp-server-ip",
    part: "Part 5",
    title: "DHCP-Server 192.168.0.10 + pool",
    pass:
      dhcp?.server?.interface.ip === "192.168.0.10" &&
      dhcp.server.services.dhcp.enabled &&
      dhcp.server.services.dhcp.pools.some((p) => p.name === "Pool-Building-A"),
  });

  const dns = byName(topology, "DNS-Server");
  checklist.push({
    id: "dns-record",
    part: "Part 5",
    title: "DNS campus.local → 192.168.2.10",
    pass: !!dns?.server?.services.dns.records.find(
      (r) => r.domainName === "campus.local" && r.ipAddress === "192.168.2.10",
    ),
  });

  const web = byName(topology, "Web-Server");
  checklist.push({
    id: "web-server",
    part: "Part 5",
    title: "Web-Server 192.168.2.10 HTTP enabled",
    pass:
      web?.server?.interface.ip === "192.168.2.10" &&
      web.server.services.http.enabled,
  });

  for (const [name, ip] of [
    ["PC-B1", "192.168.1.20"],
    ["PC-B2", "192.168.1.21"],
    ["PC-B3", "192.168.1.22"],
  ] as const) {
    const pc = byName(topology, name);
    checklist.push({
      id: `static-${name}`,
      part: "Part 5",
      title: `${name} static ${ip}`,
      pass: pc?.pc?.interface.ip === ip && pc.pc.interface.mode === "static",
    });
  }

  if (router?.router) {
    const o = router.router.ospf;
    checklist.push({
      id: "ospf-enabled",
      part: "Part 6",
      title: "OSPF enabled process 1",
      pass: o.enabled && o.processId === 1,
    });
    for (const net of [
      "192.168.0.0",
      "192.168.1.0",
      "192.168.2.0",
    ]) {
      checklist.push({
        id: `ospf-${net}`,
        part: "Part 6",
        title: `OSPF network ${net}/24 area 0`,
        pass: o.networks.some(
          (n) => n.networkAddress === net && n.wildcardMask === "0.0.0.255",
        ),
      });
    }

    const qos = router.router.qos;
    checklist.push({
      id: "qos-classes",
      part: "Part 7",
      title: "QoS class maps DHCP-DNS, Web-Traffic, Default-Traffic",
      pass: ["DHCP-DNS", "Web-Traffic", "Default-Traffic"].every((n) =>
        qos.classMaps.some((c) => c.name === n),
      ),
    });
    const policy = qos.policyMaps.find((p) => p.name === "Campus-QoS-Policy");
    checklist.push({
      id: "qos-policy",
      part: "Part 7",
      title: "Campus-QoS-Policy 50/30/20",
      pass: !!policy?.classes.find(
        (c) => c.classMapName === "DHCP-DNS" && c.bandwidthPercent === 50,
      ) &&
        !!policy?.classes.find(
          (c) => c.classMapName === "Web-Traffic" && c.bandwidthPercent === 30,
        ) &&
        !!policy?.classes.find(
          (c) => c.classMapName === "Default-Traffic" && c.bandwidthPercent === 20,
        ),
    });
    for (const ifId of ["Gi0/0", "Gi0/1", "Gi0/2"]) {
      checklist.push({
        id: `qos-sp-${ifId}`,
        part: "Part 7",
        title: `QoS policy out on ${ifId}`,
        pass: qos.servicePolicies.some(
          (sp) =>
            sp.interfacePortId === ifId &&
            sp.direction === "out" &&
            sp.policyMapName === "Campus-QoS-Policy",
        ),
      });
    }
  }

  const tests = runFunctionalTests(topology);
  const allPass =
    checklist.every((c) => c.pass) && tests.every((t) => t.pass);

  return { checklist, tests, allPass };
}

function runFunctionalTests(topology: Topology): FunctionalTestResult[] {
  const tests: FunctionalTestResult[] = [];
  let top = structuredClone(topology);

  const pcA1 = byName(top, "PC-A1");
  const pcA2 = byName(top, "PC-A2");
  const pcA3 = byName(top, "PC-A3");
  const pcB1 = byName(top, "PC-B1");
  const pcB2 = byName(top, "PC-B2");

  for (const [pc, label] of [
    [pcA1, "PC-A1"],
    [pcA2, "PC-A2"],
    [pcA3, "PC-A3"],
  ] as const) {
    if (!pc) {
      tests.push({
        id: `dhcp-${label}`,
        name: `DHCP ${label}`,
        pass: false,
        hint: "PC missing",
      });
      continue;
    }
    const res = assignDhcp(top, pc.id);
    top = res.topology;
    const ip = getDevice(top, pc.id)?.pc?.interface.ip;
    tests.push({
      id: `dhcp-${label}`,
      name: `DHCP assignment ${label}`,
      pass: res.success && !!ip?.startsWith("192.168.0."),
      output: ip,
      hint: "Enable DHCP pool on DHCP-Server and connect Building A LAN",
    });
  }

  if (pcA1) {
    const r = runSimulateAction(top, {
      type: "nslookup",
      deviceId: pcA1.id,
      hostname: "campus.local",
    });
    top = r.topology ?? top;
    tests.push({
      id: "dns-pca1",
      name: "nslookup campus.local from PC-A1",
      pass: r.output.includes("192.168.2.10"),
      output: r.output,
    });
  }

  if (pcB2) {
    const r = runSimulateAction(top, {
      type: "nslookup",
      deviceId: pcB2.id,
      hostname: "campus.local",
    });
    tests.push({
      id: "dns-pcb2",
      name: "nslookup campus.local from PC-B2",
      pass: r.output.includes("192.168.2.10"),
      output: r.output,
    });
  }

  if (pcB1) {
    const r1 = runSimulateAction(top, {
      type: "http",
      deviceId: pcB1.id,
      url: "campus.local",
    });
    tests.push({
      id: "http-name",
      name: "HTTP campus.local from PC-B1",
      pass: r1.output.includes("Campus Web Server") || r1.output.includes("Welcome"),
      output: r1.output.slice(0, 200),
    });
    const r2 = runSimulateAction(top, {
      type: "ping",
      deviceId: pcB1.id,
      target: "192.168.2.10",
    });
    tests.push({
      id: "ping-web",
      name: "Ping Web-Server from PC-B1",
      pass: r2.output.includes("Lost = 0"),
      output: r2.output.split("\r\n").slice(-3).join("\n"),
    });
  }

  if (pcA1 && pcB1) {
    const r = runSimulateAction(top, {
      type: "ping",
      deviceId: pcA1.id,
      target: "192.168.1.20",
    });
    tests.push({
      id: "ping-a-b",
      name: "Ping PC-B1 from PC-A1",
      pass: r.output.includes("Lost = 0"),
      output: r.output.split("\r\n").slice(-3).join("\n"),
    });
  }

  if (pcB1 && pcA1) {
    const ipA1 = findHostIp(getDevice(top, pcA1!.id)!) ?? "192.168.0.20";
    const r = runSimulateAction(top, {
      type: "ping",
      deviceId: pcB1.id,
      target: ipA1,
    });
    tests.push({
      id: "ping-b-a",
      name: "Ping PC-A1 from PC-B1",
      pass: r.output.includes("Lost = 0"),
    });
  }

  const router = byName(top, "Core-Router");
  if (router?.router) {
    const qosResult = runQosComparison(router.router.qos);
    const withQ = avgDhcpDnsCompletion(qosResult);
    const fifo = avgDhcpDnsCompletionFifo(qosResult);
    tests.push({
      id: "qos-priority",
      name: "QoS prioritizes DHCP/DNS under load",
      pass: withQ > 0 && withQ <= fifo,
      output: `With QoS avg ${withQ.toFixed(1)}ms vs FIFO ${fifo.toFixed(1)}ms`,
      hint: "Configure Campus-QoS-Policy on Core-Router",
    });
  }

  return tests;
}

export function validateReferencePreset(): ValidationResult {
  return validateTopology(campusQoSPreset());
}
