import { buildReportMarkdown } from "@/engine/report";
import { ValidationResultSchema, TopologySchema } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  topology: TopologySchema,
  validation: ValidationResultSchema,
});

export async function POST(req: Request) {
  const body = BodySchema.parse(await req.json());
  const markdown = buildReportMarkdown(body.topology, body.validation);
  return NextResponse.json({ markdown });
}
