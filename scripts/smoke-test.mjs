#!/usr/bin/env node
/**
 * Read-only contract check against a running deployment.
 * Usage: npm run smoke -- https://your-app.vercel.app
 */
const baseUrl = (process.argv[2] || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

let failures = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.json().catch(() => null);
  return { response, body };
}

console.log(`Smoke test: ${baseUrl}\n`);

try {
  const health = await get("/api/health");
  check(
    "health is 200",
    health.response.status === 200,
    String(health.response.status),
  );
  check("database is up", health.body?.database === "up");

  const restaurant = await get("/api/restaurant/1");
  check("restaurant is 200", restaurant.response.status === 200);
  check("restaurant has name", typeof restaurant.body?.name === "string");
  check(
    "restaurant has location",
    typeof restaurant.body?.location === "string",
  );
  check("restaurant has cuisine", typeof restaurant.body?.cuisine === "string");
  check("restaurant has type", typeof restaurant.body?.type === "string");
  check(
    "average_rating is number or null",
    restaurant.body?.average_rating === null ||
      typeof restaurant.body?.average_rating === "number",
  );

  const reviews = await get("/api/review/1");
  check("reviews are 200", reviews.response.status === 200);
  check("reviews is an array", Array.isArray(reviews.body));
  if (Array.isArray(reviews.body) && reviews.body.length > 1) {
    const sorted = reviews.body.every(
      (review, index, all) =>
        index === 0 ||
        new Date(all[index - 1].created_at).getTime() >=
          new Date(review.created_at).getTime(),
    );
    check("reviews are newest first", sorted);
  }

  const missing = await get("/api/restaurant/999999");
  check("unknown restaurant is 404", missing.response.status === 404);
  const missingReviews = await get("/api/review/999999");
  check(
    "unknown restaurant reviews are 404",
    missingReviews.response.status === 404,
  );

  const page = await fetch(`${baseUrl}/restaurant/1`);
  const html = await page.text();
  check("page is 200", page.status === 200);
  check(
    "page shows the restaurant name",
    html.includes(restaurant.body?.name ?? "\u0000"),
  );
  check("page has the review form", html.includes("Post review"));

  const invalid = await fetch(`${baseUrl}/api/review/1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: 0, review: "" }),
  });
  check("invalid post is 400", invalid.status === 400);
  const invalidBody = await invalid.json().catch(() => null);
  check("invalid post explains why", typeof invalidBody?.error === "string");

  const badRestaurant = await fetch(`${baseUrl}/api/review/999999`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: 5, review: "test" }),
  });
  check("post to unknown restaurant is 404", badRestaurant.status === 404);
} catch (error) {
  failures += 1;
  console.error(`  FAIL  request error — ${error.message}`);
}

console.log(
  `\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}`,
);
process.exit(failures === 0 ? 0 : 1);
