export type Review = {
  id: number;
  restaurant_id: number;
  rating: number;
  review: string;
  created_at: string;
  updated_at: string | null;
};

export type Restaurant = {
  id: number;
  name: string;
  location: string;
  cuisine: string;
  type: string;
  created_at: string;
  updated_at: string | null;
};

export type RestaurantDetail = Restaurant & {
  /** Sum of all ratings divided by the number of ratings; null when there are none. */
  average_rating: number | null;
  /** Most recent review by created_at; null when there are none. */
  latest_review: Review | null;
};

export type ApiError = {
  error: string;
  field?: "rating" | "review";
};
