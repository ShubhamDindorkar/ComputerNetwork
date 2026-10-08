export type DeviceKind = "router" | "switch" | "server" | "pc";
export type DeviceModel =
  | "cisco-2911"
  | "catalyst-2960-24tt"
  | "server"
  | "pc";

export type PortRef = { deviceId: string; portId: string };

export interface PortDef {
  id: string;
  label: string;
  type: "gigabit" | "fast";
}

export interface InterfaceConfig {
  ip?: string;
  subnetMask?: string;
  status: "on" | "off";
}

export interface OspfNetwork {
  networkAddress: string;
  wildcardMask: string;
  areaId: number;
}

export interface OspfConfig {
  enabled: boolean;
  processId: number;
  networks: OspfNetwork[];
}

export interface QosMatchRule {
  protocol?: "tcp" | "udp" | "any";
  port?: number;
}

export interface ClassMap {
  name: string;
  matchRules: QosMatchRule[];
}

export interface PolicyClass {
  classMapName: string;
  priorityLevel: 1 | 2 | 3;
  bandwidthPercent: number;
  congestionMethod?: "FIFO" | "WFQ";
}

export interface PolicyMap {
  name: string;
  classes: PolicyClass[];
}

export interface ServicePolicy {
  interfacePortId: string;
  direction: "in" | "out";
  policyMapName: string;
}

export interface QosConfig {
  classMaps: ClassMap[];
  policyMaps: PolicyMap[];
  servicePolicies: ServicePolicy[];
}

export interface RouterConfig {
  interfaces: Record<string, InterfaceConfig>;
  ospf: OspfConfig;
  qos: QosConfig;
}

export interface DhcpPool {
  name: string;
  defaultGateway: string;
  dnsServer: string;
  startIp: string;
  endIp: string;
  subnetMask: string;
  maxUsers?: number;
}

export interface DnsRecord {
  domainName: string;
  type: "A";
  ipAddress: string;
}

export interface ServerServices {
  dhcp: { enabled: boolean; pools: DhcpPool[] };
  dns: { enabled: boolean; records: DnsRecord[] };
  http: { enabled: boolean; port: number; indexHtml: string };
}

export interface ServerConfig {
  interface: InterfaceConfig & { defaultGateway?: string; dnsServer?: string };
  services: ServerServices;
}

export type PcIpMode = "dhcp" | "static";

export interface PcConfig {
  interface: InterfaceConfig & {
    mode: PcIpMode;
    defaultGateway?: string;
    dnsServer?: string;
  };
  lease?: { serverId?: string; expiresAt?: number };
}

export interface Device {
  id: string;
  kind: DeviceKind;
  model: DeviceModel;
  name: string;
  position: { x: number; y: number };
  router?: RouterConfig;
  server?: ServerConfig;
  pc?: PcConfig;
}

export interface Link {
  id: string;
  from: PortRef;
  to: PortRef;
  cableType: "copper-straight";
  /** ms timestamp when link was created (for UI green delay) */
  createdAt?: number;
}

export interface Topology {
  id: string;
  name: string;
  devices: Device[];
  links: Link[];
  dhcpLeases: Record<string, { ip: string; deviceId: string; poolName: string }>;
}

export type PacketProto = "icmp" | "udp" | "tcp" | "arp" | "dhcp";

export interface SimPacket {
  id: string;
  proto: PacketProto;
  srcPort?: number;
  dstPort?: number;
  className?: string;
}

export interface TraceHop {
  deviceId: string;
  deviceName: string;
  inPort?: string;
  outPort?: string;
  action: string;
}

export interface ForwardResult {
  success: boolean;
  message?: string;
  forwardTrace: TraceHop[];
  replyTrace?: TraceHop[];
  rttMs?: number;
  ttl?: number;
}

export interface ChecklistItem {
  id: string;
  part: string;
  title: string;
  pass: boolean;
  hint?: string;
}

export interface FunctionalTestResult {
  id: string;
  name: string;
  pass: boolean;
  output?: string;
  hint?: string;
}

export interface ValidationResult {
  checklist: ChecklistItem[];
  tests: FunctionalTestResult[];
  allPass: boolean;
}

export type SimulateAction =
  | { type: "ping"; deviceId: string; target: string; count?: number }
  | { type: "nslookup"; deviceId: string; hostname: string }
  | { type: "http"; deviceId: string; url: string }
  | { type: "cli"; deviceId: string; command: string }
  | { type: "dhcp-renew"; deviceId: string }
  | { type: "dhcp-release"; deviceId: string }
  | { type: "router-cli"; deviceId: string; command: string };
