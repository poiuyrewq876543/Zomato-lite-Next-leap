import { NextResponse } from "next/server";
import { jsonError, jsonNoStore } from "@/lib/http";
import { getRestaurantDetail, parseRestaurantId } from "@/lib/restaurant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/restaurant/:id — restaurant fields, average_rating, latest_review. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const restaurantId = parseRestaurantId(id);

  if (restaurantId === null) {
    return jsonError("Restaurant not found.", 404);
  }

  try {
    const restaurant = await getRestaurantDetail(restaurantId);

    if (!restaurant) {
      return jsonError("Restaurant not found.", 404);
    }

    return jsonNoStore(restaurant);
  } catch (error) {
    console.error("GET /api/restaurant/:id failed", error);
    return jsonError("Could not load the restaurant. Please try again.", 500);
  }
}
