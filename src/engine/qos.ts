import type { ClassMap, PolicyMap, QosConfig, SimPacket } from "./types";

export function classifyPacket(
  qos: QosConfig,
  packet: SimPacket,
): string {
  for (const cm of qos.classMaps) {
    if (matchesClass(cm, packet)) return cm.name;
  }
  return "Default-Traffic";
}

function packetProto(packet: SimPacket): "tcp" | "udp" | "icmp" | "other" {
  if (packet.proto === "tcp") return "tcp";
  if (packet.proto === "udp" || packet.proto === "dhcp") return "udp";
  if (packet.proto === "icmp") return "icmp";
  return "other";
}

function matchesClass(cm: ClassMap, packet: SimPacket): boolean {
  if (cm.matchRules.length === 0) return false;
  for (const rule of cm.matchRules) {
    if (rule.protocol === "any") return true;
    const pp = packetProto(packet);
    if (rule.protocol === "udp" && pp !== "udp") continue;
    if (rule.protocol === "tcp" && pp !== "tcp") continue;
    const port =
      packet.dstPort ??
      packet.srcPort ??
      (packet.proto === "dhcp" ? 67 : undefined);
    if (rule.port !== undefined && port !== rule.port) continue;
    return true;
  }
  return false;
}

export interface ScheduledPacket {
  packetId: string;
  className: string;
  dequeueTimeMs: number;
  priority: number;
}

export interface QosScheduleResult {
  withQos: ScheduledPacket[];
  fifo: ScheduledPacket[];
  classStats: Record<
    string,
    { avgMs: number; maxMs: number; count: number }
  >;
}

export function buildLoadScenario(): SimPacket[] {
  const packets: SimPacket[] = [];
  let id = 0;
  for (let i = 0; i < 20; i++) {
    packets.push({ id: `p${id++}`, proto: "tcp", dstPort: 80 });
  }
  for (let i = 0; i < 10; i++) {
    packets.push({ id: `p${id++}`, proto: "icmp" });
  }
  for (let i = 0; i < 3; i++) {
    packets.push({ id: `p${id++}`, proto: "dhcp", dstPort: 67 });
  }
  for (let i = 0; i < 3; i++) {
    packets.push({ id: `p${id++}`, proto: "udp", dstPort: 53 });
  }
  return packets;
}

function scheduleFifo(packets: SimPacket[], serviceMs = 2): ScheduledPacket[] {
  const out: ScheduledPacket[] = [];
  let t = 0;
  for (const p of packets) {
    t += serviceMs;
    out.push({
      packetId: p.id,
      className: "fifo",
      dequeueTimeMs: t,
      priority: 0,
    });
  }
  return out;
}

function scheduleWeightedQos(
  packets: SimPacket[],
  qos: QosConfig,
  policyName: string,
  serviceMs = 2,
): ScheduledPacket[] {
  const policy = qos.policyMaps.find((p) => p.name === policyName);
  if (!policy) return scheduleFifo(packets, serviceMs);

  const byClass = new Map<string, SimPacket[]>();
  for (const p of packets) {
    const cn = classifyPacket(qos, p);
    if (!byClass.has(cn)) byClass.set(cn, []);
    byClass.get(cn)!.push(p);
  }

  const classOrder = [...policy.classes].sort(
    (a, b) => b.priorityLevel - a.priorityLevel,
  );

  const weights = classOrder.map((c) => ({
    name: c.classMapName,
    weight: c.bandwidthPercent,
    priority: c.priorityLevel,
    queue: [...(byClass.get(c.classMapName) ?? [])],
  }));

  for (const [name, list] of byClass) {
    if (!weights.find((w) => w.name === name)) {
      weights.push({ name, weight: 1, priority: 1, queue: [...list] });
    }
  }

  const out: ScheduledPacket[] = [];
  let time = 0;
  let remaining = packets.length;
  const credits = weights.map((w) => ({ ...w, credit: 0 }));

  while (remaining > 0) {
    for (const w of credits) {
      w.credit += w.weight;
    }
    credits.sort((a, b) => b.priority - a.priority || b.credit - a.credit);
    const chosen = credits.find((w) => w.queue.length > 0);
    if (!chosen) break;
    const pkt = chosen.queue.shift()!;
    chosen.credit -= credits.reduce((s, c) => s + c.weight, 0) / credits.length;
    time += serviceMs;
    remaining--;
    out.push({
      packetId: pkt.id,
      className: chosen.name,
      dequeueTimeMs: time,
      priority: chosen.priority,
    });
  }

  return out;
}

export function runQosComparison(
  qos: QosConfig,
  policyName = "Campus-QoS-Policy",
): QosScheduleResult {
  const packets = buildLoadScenario();
  const withQos = scheduleWeightedQos(packets, qos, policyName);
  const fifo = scheduleFifo(packets);

  const classStats: QosScheduleResult["classStats"] = {};
  for (const s of withQos) {
    if (!classStats[s.className]) {
      classStats[s.className] = { avgMs: 0, maxMs: 0, count: 0 };
    }
    const st = classStats[s.className];
    st.count++;
    st.maxMs = Math.max(st.maxMs, s.dequeueTimeMs);
    st.avgMs += s.dequeueTimeMs;
  }
  for (const k of Object.keys(classStats)) {
    classStats[k].avgMs /= classStats[k].count;
  }

  return { withQos, fifo, classStats };
}

export function avgDhcpDnsCompletion(result: QosScheduleResult): number {
  const dhcpDns = result.withQos.filter((p) =>
    ["DHCP-DNS"].includes(p.className),
  );
  if (!dhcpDns.length) return 0;
  return dhcpDns.reduce((s, p) => s + p.dequeueTimeMs, 0) / dhcpDns.length;
}

export function avgDhcpDnsCompletionFifo(result: QosScheduleResult): number {
  const dhcpIds = new Set(
    buildLoadScenario()
      .filter((p) => p.proto === "dhcp" || (p.proto === "udp" && p.dstPort === 53))
      .map((p) => p.id),
  );
  const fifo = result.fifo.filter((p) => dhcpIds.has(p.packetId));
  if (!fifo.length) return 0;
  return fifo.reduce((s, p) => s + p.dequeueTimeMs, 0) / fifo.length;
}

export function validatePolicyBandwidth(policy: PolicyMap): string | null {
  const total = policy.classes.reduce((s, c) => s + c.bandwidthPercent, 0);
  if (total > 100) return `Policy bandwidth exceeds 100% (${total}%)`;
  return null;
}
