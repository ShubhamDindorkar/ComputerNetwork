import { runSimulateAction } from "@/engine/cli";
import { SimulateActionSchema, TopologySchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const topology = TopologySchema.parse(body.topology);
  const action = SimulateActionSchema.parse(body.action);
  const result = runSimulateAction(topology, action);
  return NextResponse.json(result);
}
