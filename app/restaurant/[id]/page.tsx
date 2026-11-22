import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";
import { Stars } from "@/components/Stars";
import { formatAverage } from "@/lib/format";
import {
  getRestaurantDetail,
  getReviews,
  parseRestaurantId,
} from "@/lib/restaurant";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const restaurantId = parseRestaurantId(id);

  if (restaurantId === null) {
    return { title: "Restaurant not found" };
  }

  const restaurant = await getRestaurantDetail(restaurantId);

  if (!restaurant) {
    return { title: "Restaurant not found" };
  }

  return {
    title: restaurant.name,
    description: `${restaurant.name} in ${restaurant.location} — ${restaurant.cuisine}, ${restaurant.type}. Read reviews or share your own.`,
  };
}

export default async function RestaurantPage({ params }: PageProps) {
  const { id } = await params;
  const restaurantId = parseRestaurantId(id);

  if (restaurantId === null) {
    notFound();
  }

  const [restaurant, reviews] = await Promise.all([
    getRestaurantDetail(restaurantId),
    getReviews(restaurantId),
  ]);

  if (!restaurant) {
    notFound();
  }

  const hasReviews = reviews.length > 0;

  return (
    <div className="page">
      <header className="topbar">
        <a className="brand" href="/restaurant/1">
          <span className="brand__mark" aria-hidden="true">
            Z
          </span>
          <span className="brand__name">
            zomato<span className="brand__lite">lite</span>
          </span>
        </a>
        <span className="topbar__tag">Sector 32</span>
      </header>

      <main>
        <section className="hero" aria-labelledby="restaurant-name">
          <div className="hero__inner">
            <div className="hero__badges">
              <span className="badge">{restaurant.cuisine}</span>
              <span className="badge badge--ghost">{restaurant.type}</span>
            </div>

            <h1 id="restaurant-name">{restaurant.name}</h1>

            <p className="hero__location">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="10" r="2.6" fill="currentColor" />
              </svg>
              {restaurant.location}
            </p>

            <div className="hero__rating">
              {restaurant.average_rating !== null ? (
                <>
                  <span className="hero__score">
                    {formatAverage(restaurant.average_rating)}
                  </span>
                  <div className="hero__rating-meta">
                    <Stars value={restaurant.average_rating} size={19} />
                    <span>Average rating</span>
                  </div>
                </>
              ) : (
                <>
                  <span
                    className="hero__score hero__score--empty"
                    aria-hidden="true"
                  >
                    —
                  </span>
                  <div className="hero__rating-meta hero__rating-meta--empty">
                    <strong>No ratings yet</strong>
                    <span>Be the first to review</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {restaurant.latest_review ? (
          <section className="section" aria-labelledby="latest-heading">
            <div className="section__head">
              <h2 id="latest-heading">Latest review</h2>
              <span className="section__hint">Most recent</span>
            </div>
            <ReviewCard review={restaurant.latest_review} highlight />
          </section>
        ) : null}

        <section className="section" aria-labelledby="reviews-heading">
          <div className="section__head">
            <h2 id="reviews-heading">All reviews</h2>
            <span className="section__hint">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>

          {hasReviews ? (
            <div className="review-list">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M4 5.5h16v11H9l-5 3.5v-14.5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
              <strong>No reviews yet</strong>
              <span>Be the first to share your experience.</span>
            </div>
          )}
        </section>

        <section
          className="section section--form"
          aria-labelledby="write-heading"
        >
          <div className="section__head">
            <h2 id="write-heading">Share your experience</h2>
            <span className="section__hint">Anonymous</span>
          </div>
          <p className="section__lede">
            A rating and a few words. It takes under a minute.
          </p>
          <ReviewForm restaurantId={restaurant.id} />
        </section>
      </main>

      <footer className="site-footer">
        <span>Zomato Lite · First release</span>
        <span>One restaurant, real reviews.</span>
      </footer>
    </div>
  );
}
