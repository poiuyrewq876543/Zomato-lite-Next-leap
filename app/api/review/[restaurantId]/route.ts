import { jsonError, jsonNoStore } from "@/lib/http";
import {
  createReview,
  getReviews,
  parseRestaurantId,
  restaurantExists,
} from "@/lib/restaurant";
import { validateReviewInput } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ restaurantId: string }> };

/** GET /api/review/:restaurantId — all reviews, newest first. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { restaurantId: rawId } = await params;
  const restaurantId = parseRestaurantId(rawId);

  if (restaurantId === null) {
    return jsonError("Restaurant not found.", 404);
  }

  try {
    if (!(await restaurantExists(restaurantId))) {
      return jsonError("Restaurant not found.", 404);
    }

    return jsonNoStore(await getReviews(restaurantId));
  } catch (error) {
    console.error("GET /api/review/:restaurantId failed", error);
    return jsonError("Could not load reviews. Please try again.", 500);
  }
}

/** POST /api/review/:restaurantId — add a review. */
export async function POST(request: Request, { params }: RouteContext) {
  const { restaurantId: rawId } = await params;
  const restaurantId = parseRestaurantId(rawId);

  if (restaurantId === null) {
    return jsonError("Restaurant not found.", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Send a JSON body with a rating and review text.", 400);
  }

  const validation = validateReviewInput(body);
  if (!validation.ok) {
    return jsonError(validation.message, 400, validation.field);
  }

  try {
    if (!(await restaurantExists(restaurantId))) {
      return jsonError("Restaurant not found.", 404);
    }

    const review = await createReview(restaurantId, validation.value);
    return jsonNoStore(review, 201);
  } catch (error) {
    const code = (error as { code?: string }).code;

    // Race: restaurant deleted between the existence check and the insert.
    if (code === "23503") {
      return jsonError("Restaurant not found.", 404);
    }

    // Defensive: the database CHECK constraints mirror the API validation.
    if (code === "23514") {
      return jsonError(
        "Rating must be a whole number from 1 to 5 and text cannot be empty.",
        400,
      );
    }

    console.error("POST /api/review/:restaurantId failed", error);
    return jsonError("Could not save your review. Please try again.", 500);
  }
}
