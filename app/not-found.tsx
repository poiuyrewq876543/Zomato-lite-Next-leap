import Link from "next/link";

export default function NotFound() {
  return (
    <main className="standalone">
      <div className="standalone__card">
        <span className="standalone__mark" aria-hidden="true">
          Z
        </span>
        <h1>Restaurant not found</h1>
        <p>This page only has one restaurant in the first release.</p>
        <Link className="button" href="/restaurant/1">
          Go to Ludhiana Burrito
        </Link>
      </div>
    </main>
  );
}
