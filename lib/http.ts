import { NextResponse } from "next/server";

export function jsonError(
  message: string,
  status: number,
  field?: "rating" | "review",
) {
  return NextResponse.json(
    { error: message, ...(field ? { field } : {}) },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function jsonNoStore(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
