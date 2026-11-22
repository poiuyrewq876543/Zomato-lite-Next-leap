# Zomato Lite

One restaurant, its reviews, and a review form. Built to the
[Zomato Lite PRD](./docs/PRD.md): view **Ludhiana Burrito** in Sector 32, see the average
rating and the latest review, read every review newest-first, and post your own in under a
minute.

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Database:** Neon Postgres (server-side `pg` pool, parameterized SQL)
- **Hosting:** Vercel
- **UI:** mobile-first hand-written CSS, no UI framework

## Live

- App: https://zomato-lite-two-wheat.vercel.app/restaurant/1
- Health: https://zomato-lite-two-wheat.vercel.app/api/health
- Source: https://github.com/poiuyrewq876543/Zomato-lite-Next-leap

## Local setup

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local      # add your Neon DATABASE_URL
npm run db:setup                # create tables + seed Ludhiana Burrito
npm run dev                     # http://localhost:3000/restaurant/1
```

`/` redirects to `/restaurant/1`.

Useful scripts:

| Script              | What it does                  |
| ------------------- | ----------------------------- |
| `npm run dev`       | Development server            |
| `npm run build`     | Production build              |
| `npm start`         | Serve the production build    |
| `npm run typecheck` | TypeScript, no emit           |
| `npm run db:setup`  | Idempotent schema + seed load |

## API contract

All responses are JSON. Errors look like `{ "error": "…", "field?": "rating" | "review" }`.
Every database query is parameterized.

### `GET /api/restaurant/:id`

Restaurant fields plus the server-calculated `average_rating` (sum of ratings ÷ number of
ratings, one decimal, `null` when there are no reviews) and `latest_review` (`null` when
there are none).

```bash
curl http://localhost:3000/api/restaurant/1
```

`200` on success, `404` if the restaurant does not exist.

### `GET /api/review/:restaurantId`

Array of all reviews, newest first (`created_at DESC, id DESC`).

```bash
curl http://localhost:3000/api/review/1
```

`200` on success, `404` if the restaurant does not exist.

### `POST /api/review/:restaurantId`

```bash
curl -X POST http://localhost:3000/api/review/1 \
  -H 'Content-Type: application/json' \
  -d '{"rating":5,"review":"Great burrito"}'
```

- `201` with the created review.
- `400` when the rating is not a whole number from 1 to 5, the text is empty/whitespace, the
  text exceeds 500 characters, or the body is not valid JSON.
- `404` when the restaurant does not exist.

### `GET /api/health`

`200 {"status":"ok","database":"up"}`, or `503` when the database is unreachable.

## Data model

`restaurant` 1 ── \* `review` (via `review.restaurant_id`, `ON DELETE CASCADE`).

| restaurant | type        | rule                     |
| ---------- | ----------- | ------------------------ |
| id         | integer     | primary key, DB-assigned |
| name       | text        | required                 |
| location   | text        | required                 |
| cuisine    | text        | required                 |
| type       | text        | required                 |
| created_at | timestamptz | set on insert            |
| updated_at | timestamptz | empty in this release    |

| review        | type        | rule                             |
| ------------- | ----------- | -------------------------------- |
| id            | integer     | primary key, DB-assigned         |
| restaurant_id | integer     | FK → `restaurant.id`             |
| rating        | integer     | `CHECK (rating BETWEEN 1 AND 5)` |
| review        | text        | required, `CHECK` non-empty      |
| created_at    | timestamptz | set on insert                    |
| updated_at    | timestamptz | empty in this release            |

Seed data: restaurant `1` (Ludhiana Burrito · Sector 32 · Indian · dine-in) and review `100`
(rating 5, “great”). `updated_at` stays empty because no feature edits rows yet.

## PRD traceability

| Requirement                                                        | Where it lives                                                                           |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| US-1 / FR-1 — restaurant details, average, “No ratings yet”        | `app/restaurant/[id]/page.tsx`, `lib/restaurant.ts`                                      |
| US-2 / FR-4 — latest review in its own section, hidden when empty  | page latest section, `latest_review` query                                               |
| US-3 / FR-3 — all reviews, newest first, rating + text + date      | page review list, `ORDER BY created_at DESC, id DESC`                                    |
| US-4 / FR-5 / FR-6 — 1–5 rating, non-empty text, clear errors      | `components/ReviewForm.tsx`, `lib/validation.ts`, POST route                             |
| FR-2 — average = sum ÷ count, nothing numeric when empty           | SQL aggregate + `average_rating: null`                                                   |
| FR-7 — refresh average, latest and list without full reload        | `router.refresh()` after a successful post                                               |
| API — 3 endpoints, 400/404 rules                                   | `app/api/**`                                                                             |
| NFR — secrets only in env, parameterized SQL, 360 px+, <2 s target | `.env.local`/Vercel env, `pg` parameters, mobile-first CSS, static shell + small queries |

**Decisions on the PRD’s open questions:** the latest review appears in **both** its own
section and the full list, and the release ships **one page plus the API**.

## Security notes

- `DATABASE_URL` is read only from the environment. `.env*` files are gitignored; only
  `.env.example` is committed. The value is set in Vercel project settings.
- All SQL uses `$1`-style parameters — no string-joined queries.
- The POST body is validated on the server (source of truth) and mirrored in the form.
- Reviews are anonymous and there is no rate limiting, matching the PRD’s accepted risk for
  this release.

> **Before sharing publicly:** the PRD says the database password was exposed in the design
> screenshot and must be rotated in Neon. Rotate it, then update `DATABASE_URL` locally and in
> Vercel. Also note that `/restaurant/<unknown-id>` renders the not-found UI with HTTP 200
> because Next.js has already started streaming the response; the API returns a true 404.

## Deploy

```bash
npx vercel link --yes
npx vercel env add DATABASE_URL production
npm run build
npx vercel --prod
```

Then confirm `GET /api/health` returns `{"status":"ok"}` and post one review end to end.

## Project structure

```
app/
  api/restaurant/[id]/route.ts    GET restaurant + average + latest
  api/review/[restaurantId]/      GET list, POST review
  api/health/route.ts             readiness probe
  restaurant/[id]/page.tsx        server-rendered page
  restaurant/[id]/loading.tsx     skeleton
components/                       Stars, ReviewCard, ReviewForm
lib/                              db pool, queries, validation, formatting
db/                               schema.sql, seed.sql
scripts/db-setup.mjs              idempotent setup
```
