import { cache } from "react";
import { getPool } from "./db";
import type { RestaurantDetail, Review } from "./types";

type RestaurantRow = {
  id: number;
  name: string;
  location: string;
  cuisine: string;
  type: string;
  created_at: Date;
  updated_at: Date | null;
  review_count: number;
  average_rating: number | null;
};

type ReviewRow = {
  id: number;
  restaurant_id: number;
  rating: number;
  review: string;
  created_at: Date;
  updated_at: Date | null;
};

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    restaurant_id: row.restaurant_id,
    rating: row.rating,
    review: row.review,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Parse a path segment as a positive integer id, or return null. */
export function parseRestaurantId(raw: string): number | null {
  if (!/^[1-9]\d{0,9}$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

/**
 * Wrapped in React cache so generateMetadata and the page share one query
 * within a single request.
 */
export const getRestaurantDetail = cache(
  async (id: number): Promise<RestaurantDetail | null> => {
    const pool = getPool();

    // FR-2: average = sum of all ratings / number of ratings (null when none).
    const restaurantQuery = pool.query<RestaurantRow>(
      `SELECT
       r.id,
       r.name,
       r.location,
       r.cuisine,
       r.type,
       r.created_at,
       r.updated_at,
       COUNT(v.id)::int AS review_count,
       (SUM(v.rating)::float8 / NULLIF(COUNT(v.id), 0)) AS average_rating
     FROM restaurant r
     LEFT JOIN review v ON v.restaurant_id = r.id
     WHERE r.id = $1
     GROUP BY r.id`,
      [id],
    );

    // FR-4: the latest review is the one with the most recent created date.
    const latestQuery = pool.query<ReviewRow>(
      `SELECT id, restaurant_id, rating, review, created_at, updated_at
     FROM review
     WHERE restaurant_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
      [id],
    );

    const [restaurantResult, latestResult] = await Promise.all([
      restaurantQuery,
      latestQuery,
    ]);
    const row = restaurantResult.rows[0];

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      location: row.location,
      cuisine: row.cuisine,
      type: row.type,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at ? row.updated_at.toISOString() : null,
      average_rating:
        row.review_count > 0 && row.average_rating !== null
          ? roundToOneDecimal(row.average_rating)
          : null,
      latest_review: latestResult.rows[0]
        ? toReview(latestResult.rows[0])
        : null,
    };
  },
);

/** FR-3: all reviews, newest first. */
export async function getReviews(restaurantId: number): Promise<Review[]> {
  const result = await getPool().query<ReviewRow>(
    `SELECT id, restaurant_id, rating, review, created_at, updated_at
     FROM review
     WHERE restaurant_id = $1
     ORDER BY created_at DESC, id DESC`,
    [restaurantId],
  );

  return result.rows.map(toReview);
}

export async function restaurantExists(id: number): Promise<boolean> {
  const result = await getPool().query<{ exists: boolean }>(
    "SELECT EXISTS (SELECT 1 FROM restaurant WHERE id = $1) AS exists",
    [id],
  );

  return result.rows[0]?.exists === true;
}

/** FR-5: insert a validated review. Parameterized by construction. */
export async function createReview(
  restaurantId: number,
  input: { rating: number; review: string },
): Promise<Review> {
  const result = await getPool().query<ReviewRow>(
    `INSERT INTO review (restaurant_id, rating, review)
     VALUES ($1, $2, $3)
     RETURNING id, restaurant_id, rating, review, created_at, updated_at`,
    [restaurantId, input.rating, input.review],
  );

  return toReview(result.rows[0]);
}
