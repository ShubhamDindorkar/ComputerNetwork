import { PRESETS } from "@/engine/presets/index";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const fn = PRESETS[id];
  if (!fn) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(fn());
}
