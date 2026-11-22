"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_REVIEW_LENGTH } from "@/lib/validation";

const STAR_PATH =
  "M12 2.4l2.95 5.98 6.6.96-4.78 4.66 1.13 6.57L12 17.46l-5.9 3.11 1.13-6.57L2.45 9.34l6.6-.96L12 2.4z";

type FormError = {
  message: string;
  field?: "rating" | "review";
} | null;

type ReviewFormProps = {
  restaurantId: number;
};

export function ReviewForm({ restaurantId }: ReviewFormProps) {
  const router = useRouter();
  const formId = useId();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<FormError>(null);
  const [success, setSuccess] = useState(false);

  const preview = hovered || rating;
  const errorId = `${formId}-error`;

  function describedBy(field: "rating" | "review") {
    return error?.field === field ? errorId : undefined;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSuccess(false);

    const trimmed = text.trim();

    if (rating < 1 || rating > 5) {
      setError({ field: "rating", message: "Choose a rating from 1 to 5." });
      return;
    }

    if (trimmed.length === 0) {
      setError({
        field: "review",
        message: "Write a few words about your visit.",
      });
      return;
    }

    if (trimmed.length > MAX_REVIEW_LENGTH) {
      setError({
        field: "review",
        message: `Review text must be ${MAX_REVIEW_LENGTH} characters or fewer.`,
      });
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/review/${restaurantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review: trimmed }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        field?: "rating" | "review";
      } | null;

      if (!response.ok) {
        setError({
          message:
            data?.error ?? "Could not save your review. Please try again.",
          field: data?.field,
        });
        return;
      }

      setRating(0);
      setHovered(0);
      setText("");
      setSuccess(true);
      // FR-7: re-render the server components so the average, latest review
      // and list all update without a full page reload.
      router.refresh();
    } catch {
      setError({
        message: "Network error. Check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      <fieldset className="rating-field">
        <legend>Your rating</legend>
        <div className="star-picker" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className={`star-choice${preview >= value ? " is-on" : ""}`}
              onMouseEnter={() => setHovered(value)}
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => {
                  setRating(value);
                  setError(null);
                  setSuccess(false);
                }}
                aria-describedby={describedBy("rating")}
              />
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d={STAR_PATH} fill="currentColor" />
              </svg>
              <span className="sr-only">
                {value} star{value === 1 ? "" : "s"}
              </span>
            </label>
          ))}
          <span
            className={`star-picker__value${preview ? " is-set" : ""}`}
            aria-live="polite"
          >
            {preview ? `${preview}/5` : "Tap to rate"}
          </span>
        </div>
      </fieldset>

      <div className="field">
        <div className="field__label-row">
          <label htmlFor={`${formId}-text`}>Your review</label>
          <span className="field__counter">
            {text.length}/{MAX_REVIEW_LENGTH}
          </span>
        </div>
        <textarea
          id={`${formId}-text`}
          name="review"
          rows={4}
          maxLength={MAX_REVIEW_LENGTH}
          placeholder="What did you eat? How was it?"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (error?.field === "review") setError(null);
            setSuccess(false);
          }}
          aria-invalid={error?.field === "review" ? true : undefined}
          aria-describedby={describedBy("review")}
        />
      </div>

      {error ? (
        <p
          className="form-message form-message--error"
          id={errorId}
          role="alert"
        >
          {error.message}
        </p>
      ) : null}

      {success ? (
        <p className="form-message form-message--success" role="status">
          Thanks! Your review is live.
        </p>
      ) : null}

      <button type="submit" className="button" disabled={submitting}>
        {submitting ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}
