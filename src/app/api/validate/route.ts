import { validateTopology } from "@/engine/validate";
import { TopologySchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const topology = TopologySchema.parse(body.topology);
  return NextResponse.json(validateTopology(topology));
}
