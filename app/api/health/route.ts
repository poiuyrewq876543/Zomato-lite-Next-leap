import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Lightweight readiness probe used after deployment. */
export async function GET() {
  try {
    await getPool().query("SELECT 1");
    return NextResponse.json(
      { status: "ok", database: "up" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/health failed", error);
    return NextResponse.json(
      { status: "error", database: "down" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
