import { z } from "zod";

export const TopologySchema = z.object({
  id: z.string(),
  name: z.string(),
  devices: z.array(z.any()),
  links: z.array(z.any()),
  dhcpLeases: z.record(z.any()),
});

export const SimulateActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("ping"),
    deviceId: z.string(),
    target: z.string(),
    count: z.number().optional(),
  }),
  z.object({
    type: z.literal("nslookup"),
    deviceId: z.string(),
    hostname: z.string(),
  }),
  z.object({
    type: z.literal("http"),
    deviceId: z.string(),
    url: z.string(),
  }),
  z.object({
    type: z.literal("cli"),
    deviceId: z.string(),
    command: z.string(),
  }),
  z.object({ type: z.literal("dhcp-renew"), deviceId: z.string() }),
  z.object({ type: z.literal("dhcp-release"), deviceId: z.string() }),
  z.object({
    type: z.literal("router-cli"),
    deviceId: z.string(),
    command: z.string(),
  }),
]);

export const ValidationResultSchema = z.object({
  checklist: z.array(z.any()),
  tests: z.array(z.any()),
  allPass: z.boolean(),
});
