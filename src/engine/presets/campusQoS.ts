import { createDevice } from "../catalog";
import type { Topology } from "../types";

export function campusQoSPreset(): Topology {
  const coreRouter = createDevice("cisco-2911", "dev-core-router", "Core-Router", {
    x: 400,
    y: 80,
  });
  coreRouter.router!.interfaces["Gi0/0"] = {
    ip: "192.168.0.1",
    subnetMask: "255.255.255.0",
    status: "on",
  };
  coreRouter.router!.interfaces["Gi0/1"] = {
    ip: "192.168.1.1",
    subnetMask: "255.255.255.0",
    status: "on",
  };
  coreRouter.router!.interfaces["Gi0/2"] = {
    ip: "192.168.2.1",
    subnetMask: "255.255.255.0",
    status: "on",
  };
  coreRouter.router!.ospf = {
    enabled: true,
    processId: 1,
    networks: [
      { networkAddress: "192.168.0.0", wildcardMask: "0.0.0.255", areaId: 0 },
      { networkAddress: "192.168.1.0", wildcardMask: "0.0.0.255", areaId: 0 },
      { networkAddress: "192.168.2.0", wildcardMask: "0.0.0.255", areaId: 0 },
    ],
  };
  coreRouter.router!.qos = {
    classMaps: [
      {
        name: "DHCP-DNS",
        matchRules: [
          { protocol: "udp", port: 67 },
          { protocol: "udp", port: 68 },
          { protocol: "udp", port: 53 },
        ],
      },
      {
        name: "Web-Traffic",
        matchRules: [
          { protocol: "tcp", port: 80 },
          { protocol: "tcp", port: 443 },
        ],
      },
      { name: "Default-Traffic", matchRules: [{ protocol: "any" }] },
    ],
    policyMaps: [
      {
        name: "Campus-QoS-Policy",
        classes: [
          {
            classMapName: "DHCP-DNS",
            priorityLevel: 3,
            bandwidthPercent: 50,
            congestionMethod: "WFQ",
          },
          {
            classMapName: "Web-Traffic",
            priorityLevel: 2,
            bandwidthPercent: 30,
            congestionMethod: "WFQ",
          },
          {
            classMapName: "Default-Traffic",
            priorityLevel: 1,
            bandwidthPercent: 20,
            congestionMethod: "FIFO",
          },
        ],
      },
    ],
    servicePolicies: [
      { interfacePortId: "Gi0/0", direction: "out", policyMapName: "Campus-QoS-Policy" },
      { interfacePortId: "Gi0/1", direction: "out", policyMapName: "Campus-QoS-Policy" },
      { interfacePortId: "Gi0/2", direction: "out", policyMapName: "Campus-QoS-Policy" },
    ],
  };

  const switchA = createDevice(
    "catalyst-2960-24tt",
    "dev-switch-a",
    "Switch-A",
    { x: 200, y: 220 },
  );
  const switchB = createDevice(
    "catalyst-2960-24tt",
    "dev-switch-b",
    "Switch-B",
    { x: 600, y: 220 },
  );

  const dhcpServer = createDevice("server", "dev-dhcp", "DHCP-Server", {
    x: 80,
    y: 380,
  });
  dhcpServer.server!.interface = {
    ip: "192.168.0.10",
    subnetMask: "255.255.255.0",
    defaultGateway: "192.168.0.1",
    status: "on",
  };
  dhcpServer.server!.services.dhcp = {
    enabled: true,
    pools: [
      {
        name: "Pool-Building-A",
        defaultGateway: "192.168.0.1",
        dnsServer: "192.168.0.11",
        startIp: "192.168.0.20",
        endIp: "192.168.0.100",
        subnetMask: "255.255.255.0",
        maxUsers: 80,
      },
    ],
  };

  const dnsServer = createDevice("server", "dev-dns", "DNS-Server", {
    x: 200,
    y: 380,
  });
  dnsServer.server!.interface = {
    ip: "192.168.0.11",
    subnetMask: "255.255.255.0",
    defaultGateway: "192.168.0.1",
    status: "on",
  };
  dnsServer.server!.services.dns = {
    enabled: true,
    records: [
      { domainName: "campus.local", type: "A", ipAddress: "192.168.2.10" },
    ],
  };

  const webServer = createDevice("server", "dev-web", "Web-Server", {
    x: 600,
    y: 380,
  });
  webServer.server!.interface = {
    ip: "192.168.2.10",
    subnetMask: "255.255.255.0",
    defaultGateway: "192.168.2.1",
    status: "on",
  };
  webServer.server!.services.http = {
    enabled: true,
    port: 80,
    indexHtml:
      "<html><body><h1>Campus Web Server</h1><p>Welcome to campus.local</p></body></html>",
  };

  const pcA1 = createDevice("pc", "dev-pca1", "PC-A1", { x: 80, y: 520 });
  pcA1.pc!.interface = { mode: "dhcp", status: "on" };

  const pcA2 = createDevice("pc", "dev-pca2", "PC-A2", { x: 180, y: 520 });
  pcA2.pc!.interface = { mode: "dhcp", status: "on" };

  const pcA3 = createDevice("pc", "dev-pca3", "PC-A3", { x: 280, y: 520 });
  pcA3.pc!.interface = { mode: "dhcp", status: "on" };

  const pcB1 = createDevice("pc", "dev-pcb1", "PC-B1", { x: 520, y: 520 });
  pcB1.pc!.interface = {
    mode: "static",
    status: "on",
    ip: "192.168.1.20",
    subnetMask: "255.255.255.0",
    defaultGateway: "192.168.1.1",
    dnsServer: "192.168.0.11",
  };

  const pcB2 = createDevice("pc", "dev-pcb2", "PC-B2", { x: 620, y: 520 });
  pcB2.pc!.interface = {
    mode: "static",
    status: "on",
    ip: "192.168.1.21",
    subnetMask: "255.255.255.0",
    defaultGateway: "192.168.1.1",
    dnsServer: "192.168.0.11",
  };

  const pcB3 = createDevice("pc", "dev-pcb3", "PC-B3", { x: 720, y: 520 });
  pcB3.pc!.interface = {
    mode: "static",
    status: "on",
    ip: "192.168.1.22",
    subnetMask: "255.255.255.0",
    defaultGateway: "192.168.1.1",
    dnsServer: "192.168.0.11",
  };

  const links: Topology["links"] = [
    {
      id: "link-1",
      from: { deviceId: "dev-core-router", portId: "Gi0/0" },
      to: { deviceId: "dev-switch-a", portId: "Gi0/1" },
      cableType: "copper-straight",
    },
    {
      id: "link-2",
      from: { deviceId: "dev-core-router", portId: "Gi0/1" },
      to: { deviceId: "dev-switch-b", portId: "Gi0/1" },
      cableType: "copper-straight",
    },
    {
      id: "link-3",
      from: { deviceId: "dev-core-router", portId: "Gi0/2" },
      to: { deviceId: "dev-web", portId: "Gi0" },
      cableType: "copper-straight",
    },
    {
      id: "link-4",
      from: { deviceId: "dev-switch-a", portId: "Fa0/2" },
      to: { deviceId: "dev-dhcp", portId: "Gi0" },
      cableType: "copper-straight",
    },
    {
      id: "link-5",
      from: { deviceId: "dev-switch-a", portId: "Fa0/3" },
      to: { deviceId: "dev-dns", portId: "Gi0" },
      cableType: "copper-straight",
    },
    {
      id: "link-6",
      from: { deviceId: "dev-switch-a", portId: "Fa0/4" },
      to: { deviceId: "dev-pca1", portId: "Fa0" },
      cableType: "copper-straight",
    },
    {
      id: "link-7",
      from: { deviceId: "dev-switch-a", portId: "Fa0/5" },
      to: { deviceId: "dev-pca2", portId: "Fa0" },
      cableType: "copper-straight",
    },
    {
      id: "link-8",
      from: { deviceId: "dev-switch-a", portId: "Fa0/6" },
      to: { deviceId: "dev-pca3", portId: "Fa0" },
      cableType: "copper-straight",
    },
    {
      id: "link-9",
      from: { deviceId: "dev-switch-b", portId: "Fa0/4" },
      to: { deviceId: "dev-pcb1", portId: "Fa0" },
      cableType: "copper-straight",
    },
    {
      id: "link-10",
      from: { deviceId: "dev-switch-b", portId: "Fa0/5" },
      to: { deviceId: "dev-pcb2", portId: "Fa0" },
      cableType: "copper-straight",
    },
    {
      id: "link-11",
      from: { deviceId: "dev-switch-b", portId: "Fa0/6" },
      to: { deviceId: "dev-pcb3", portId: "Fa0" },
      cableType: "copper-straight",
    },
  ];

  return {
    id: "campus-qos",
    name: "Campus_Network_QoS_Project",
    devices: [
      coreRouter,
      switchA,
      switchB,
      dhcpServer,
      dnsServer,
      webServer,
      pcA1,
      pcA2,
      pcA3,
      pcB1,
      pcB2,
      pcB3,
    ],
    links,
    dhcpLeases: {},
  };
}

export function campusQoSCabledOnly(): Topology {
  const full = campusQoSPreset();
  for (const d of full.devices) {
    if (d.router) {
      d.router = {
        interfaces: Object.fromEntries(
          Object.keys(d.router.interfaces).map((k) => [k, { status: "on" as const }]),
        ),
        ospf: { enabled: false, processId: 1, networks: [] },
        qos: { classMaps: [], policyMaps: [], servicePolicies: [] },
      };
    }
    if (d.server) {
      d.server = {
        interface: { status: "on" },
        services: {
          dhcp: { enabled: false, pools: [] },
          dns: { enabled: false, records: [] },
          http: { enabled: false, port: 80, indexHtml: "" },
        },
      };
    }
    if (d.pc) {
      d.pc = { interface: { mode: "dhcp", status: "on" } };
    }
  }
  full.name = "Campus_Cabled_Only";
  return full;
}
