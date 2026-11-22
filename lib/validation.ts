export const MAX_REVIEW_LENGTH = 500;

export type ValidReview = {
  rating: number;
  review: string;
};

export type ValidationResult =
  | { ok: true; value: ValidReview }
  | { ok: false; field?: "rating" | "review"; message: string };

/**
 * FR-5 / FR-6: a whole-number rating from 1 to 5 and non-empty text.
 * The same rule runs on the server (source of truth) and in the form.
 */
export function validateReviewInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      ok: false,
      message: "Send a JSON object with a rating and review text.",
    };
  }

  const { rating, review } = body as Record<string, unknown>;

  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return {
      ok: false,
      field: "rating",
      message: "Rating must be a whole number from 1 to 5.",
    };
  }

  if (typeof review !== "string") {
    return { ok: false, field: "review", message: "Review text is required." };
  }

  const trimmed = review.trim();

  if (trimmed.length === 0) {
    return {
      ok: false,
      field: "review",
      message: "Review text cannot be empty.",
    };
  }

  if (trimmed.length > MAX_REVIEW_LENGTH) {
    return {
      ok: false,
      field: "review",
      message: `Review text must be ${MAX_REVIEW_LENGTH} characters or fewer.`,
    };
  }

  return { ok: true, value: { rating, review: trimmed } };
}
