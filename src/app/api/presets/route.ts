import { listPresets } from "@/engine/presets/index";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(listPresets());
}
