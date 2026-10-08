import { getDevice } from "@/engine/l2";
import {
  avgDhcpDnsCompletion,
  avgDhcpDnsCompletionFifo,
  runQosComparison,
} from "@/engine/qos";
import { TopologySchema } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  topology: TopologySchema,
  deviceId: z.string(),
  interfacePortId: z.string(),
});

export async function POST(req: Request) {
  const body = BodySchema.parse(await req.json());
  const router = getDevice(body.topology, body.deviceId);
  if (!router?.router) {
    return NextResponse.json({ error: "Not a router" }, { status: 400 });
  }
  const result = runQosComparison(router.router.qos);
  return NextResponse.json({
    interfacePortId: body.interfacePortId,
    withQos: result.withQos,
    fifo: result.fifo,
    classStats: result.classStats,
    dhcpDnsAvgWithQos: avgDhcpDnsCompletion(result),
    dhcpDnsAvgFifo: avgDhcpDnsCompletionFifo(result),
  });
}
