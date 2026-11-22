"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="standalone">
      <div className="standalone__card">
        <span className="standalone__mark" aria-hidden="true">
          !
        </span>
        <h1>Something went wrong</h1>
        <p>We couldn&apos;t load the restaurant. Please try again.</p>
        <button type="button" className="button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
