import { formatReviewDate } from "@/lib/format";
import type { Review } from "@/lib/types";
import { Stars } from "./Stars";

type ReviewCardProps = {
  review: Review;
  highlight?: boolean;
};

export function ReviewCard({ review, highlight = false }: ReviewCardProps) {
  return (
    <article
      className={`review-card${highlight ? " review-card--highlight" : ""}`}
    >
      <header className="review-card__head">
        <div className="review-card__rating">
          <Stars value={review.rating} size={15} />
          <span className="review-card__score">{review.rating}/5</span>
          {highlight ? <span className="chip chip--latest">Newest</span> : null}
        </div>
        <time className="review-card__date" dateTime={review.created_at}>
          {formatReviewDate(review.created_at)}
        </time>
      </header>
      <p className="review-card__text">{review.review}</p>
    </article>
  );
}
