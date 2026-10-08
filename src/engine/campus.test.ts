import { describe, expect, it } from "vitest";
import { assignDhcp } from "./dhcp";
import { runSimulateAction } from "./cli";
import { campusQoSPreset } from "./presets/campusQoS";
import { validateReferencePreset } from "./validate";
import { classifyPacket, runQosComparison } from "./qos";

describe("campus QoS preset", () => {
  it("validates reference preset", () => {
    const v = validateReferencePreset();
    if (!v.allPass) {
      console.log(
        v.checklist.filter((c) => !c.pass),
        v.tests.filter((t) => !t.pass),
      );
    }
    expect(v.allPass).toBe(true);
  });

  it("assigns DHCP in order", () => {
    let top = campusQoSPreset();
    const ids = ["dev-pca1", "dev-pca2", "dev-pca3"];
    const ips: string[] = [];
    for (const id of ids) {
      const r = assignDhcp(top, id);
      expect(r.success).toBe(true);
      top = r.topology;
      const ip = top.devices.find((d) => d.id === id)?.pc?.interface.ip;
      if (ip) ips.push(ip);
    }
    expect(ips).toEqual(["192.168.0.20", "192.168.0.21", "192.168.0.22"]);
  });

  it("ping cross-subnet", () => {
    let top = campusQoSPreset();
    for (const id of ["dev-pca1", "dev-pca2", "dev-pca3"]) {
      top = assignDhcp(top, id).topology;
    }
    const r = runSimulateAction(top, {
      type: "ping",
      deviceId: "dev-pca1",
      target: "192.168.1.20",
    });
    expect(r.output).toContain("Lost = 0");
  });

  it("nslookup campus.local", () => {
    let top = campusQoSPreset();
    top = assignDhcp(top, "dev-pca1").topology;
    const r = runSimulateAction(top, {
      type: "nslookup",
      deviceId: "dev-pca1",
      hostname: "campus.local",
    });
    expect(r.output).toContain("192.168.2.10");
  });

  it("QoS classifies DHCP before default", () => {
    const top = campusQoSPreset();
    const qos = top.devices[0].router!.qos;
    expect(classifyPacket(qos, { id: "1", proto: "udp", dstPort: 53 })).toBe(
      "DHCP-DNS",
    );
    expect(classifyPacket(qos, { id: "2", proto: "tcp", dstPort: 80 })).toBe(
      "Web-Traffic",
    );
    const cmp = runQosComparison(qos);
    const dhcpFirst = cmp.withQos.find((p) => p.className === "DHCP-DNS");
    expect(dhcpFirst).toBeDefined();
  });
});
