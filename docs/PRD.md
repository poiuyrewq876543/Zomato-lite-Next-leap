# Zomato Lite: Product Requirements Document

Nov 22, 2026 · @Aditya

## Overview

Zomato Lite lets a diner open a restaurant page, see its average rating and latest review,
read all reviews, and post their own. The first release covers one restaurant, Ludhiana
Burrito in Sector 32, and proves this core loop end to end.

**Problem.** A diner deciding where to eat wants a quick signal of quality. A single average
rating gives that signal at a glance. Recent reviews then tell the diner whether the quality
still holds today. Without both, the diner has to guess or ask around.

**Why build it.** The loop of reading reviews and adding one is the smallest product that
delivers value to both sides. Diners get a decision aid. The restaurant gets feedback it can
act on. Every later feature, such as search or more restaurants, depends on this loop working
first.

**Source.** This PRD is based on the system design drawn in Whimsical. That design defines two
data tables, three API endpoints, three business rules, a Neon Postgres database, and Vercel
hosting.

## Goals and non-goals

The first release succeeds when a diner can view the restaurant and post a review that
immediately changes the average rating.

### Goals

- Show one restaurant's details with an accurate average rating.
- Show the latest review separately, so the newest feedback is seen first.
- List all reviews, newest first.
- Let a diner post a review with a rating from 1 to 5 and a short text.
- Run live on Vercel with data stored in Neon Postgres.

### Non-goals

- Multiple restaurants, search, or filtering. The design shows one restaurant only.
- User accounts and login. Reviews are anonymous in this release.
- Editing or deleting reviews. The design has no update or delete endpoint.
- Adding or editing restaurants through the app. Restaurant data is seeded directly.
- Photos, replies to reviews, ordering, or payments.

## Target users

| User                     | Who they are                                    | Job they want done                                     | What they use                              |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| Diner deciding (primary) | Someone choosing where to eat, often on a phone | Judge quickly whether the restaurant is good right now | Average rating, latest review, review list |
| Diner who visited        | Someone who has eaten at the restaurant         | Share their experience in under a minute               | Review form                                |

The restaurant owner benefits from the reviews but has no screen of their own in this release.

## User stories

### US-1. View the restaurant

As a diner, I want to see the restaurant's details and average rating, so that I can judge it
at a glance.

- The page shows name, location, cuisine, and type.
- The average rating equals the sum of all ratings divided by the number of ratings.
- When there are no reviews, the page shows "No ratings yet" instead of a number.

### US-2. See the latest review

As a diner, I want the newest review shown on its own, so that I know whether recent visits
were good.

- The latest review appears in its own section, above the full list.
- It is the review with the most recent created date.
- When there are no reviews, the section is hidden.

### US-3. Read all reviews

As a diner, I want to read every review in date order, so that I can see how opinions have
changed.

- Reviews are sorted newest first.
- Each review shows its rating, text, and date.

### US-4. Post a review

As a diner who visited, I want to leave a rating and comment, so that others can benefit from
my experience.

- The form accepts a whole-number rating from 1 to 5 and non-empty text.
- Invalid input shows a clear error and saves nothing.
- After a successful post, the new review appears as the latest review, and the average rating
  updates.

## Functional requirements

| ID   | Requirement                                                                                                                              | Source                     |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| FR-1 | Show restaurant name, location, cuisine, and type on the page `/restaurant/[id]`.                                                        | Restaurant table in design |
| FR-2 | Calculate the average rating as the sum of all ratings divided by the number of ratings. Show nothing numeric when there are no ratings. | Design note 1              |
| FR-3 | Sort reviews by created date, newest first.                                                                                              | Design note 2              |
| FR-4 | Show the latest review in its own section, separate from the list.                                                                       | Design note 3              |
| FR-5 | Provide a form to submit a rating from 1 to 5 and review text.                                                                           | POST review endpoint       |
| FR-6 | Reject a rating outside 1 to 5 or empty text, and tell the diner why.                                                                    | Inferred from FR-5         |
| FR-7 | After a post, refresh the average, latest review, and list without a full page reload.                                                   | Inferred from FR-2 to FR-4 |

FR-6 and FR-7 are not drawn in the design. They are included because without them the form
would either store bad data or leave the page out of date after a post.

## Data model

Two tables hold all data. One restaurant has many reviews, linked by `restaurant_id`.

### restaurant

| Column     | Type      | Rule                        | Example          |
| ---------- | --------- | --------------------------- | ---------------- |
| id         | integer   | Primary key                 | 1                |
| name       | text      | Required                    | Ludhiana Burrito |
| location   | text      | Required                    | Sector 32        |
| cuisine    | text      | Required                    | Indian           |
| type       | text      | Required                    | dine-in          |
| created_at | timestamp | Set when the row is created |                  |
| updated_at | timestamp | Empty in this release       |                  |

### review

| Column        | Type      | Rule                                  | Example |
| ------------- | --------- | ------------------------------------- | ------- |
| id            | integer   | Primary key, assigned by the database | 100     |
| restaurant_id | integer   | Foreign key to `restaurant.id`        | 1       |
| rating        | integer   | Whole number from 1 to 5              | 5       |
| review        | text      | Required, not empty                   | great   |
| created_at    | timestamp | Set when the row is created           |         |
| updated_at    | timestamp | Empty in this release                 |         |

The `updated_at` columns stay empty because no feature edits rows yet. They are kept so that a
future edit feature needs no schema change. The example values are the seed data for launch.

## API contract

| Endpoint                         | Purpose                                | Request                   | Success response                                                                                      | Errors                                            |
| -------------------------------- | -------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| GET `/api/restaurant/:id`        | Restaurant details for the page header | Restaurant id in the path | 200 with restaurant fields, `average_rating` (null if no reviews), and `latest_review` (null if none) | 404 if the restaurant does not exist              |
| GET `/api/review/:restaurantId`  | Full review list                       | Restaurant id in the path | 200 with all reviews, newest first                                                                    | 404 if the restaurant does not exist              |
| POST `/api/review/:restaurantId` | Add a review                           | Body `{ rating, review }` | 201 with the created review                                                                           | 400 for invalid input, 404 for unknown restaurant |

The average and the latest review are calculated by the server, not the browser. This keeps
the rule in one place, so every client shows the same number.

## Non-functional requirements

| Area        | Requirement                                                                                                                                                    | Why it matters                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Security    | The database connection string lives only in the `DATABASE_URL` environment variable on Vercel and locally. It never appears in code, screenshots, or prompts. | The design screenshot exposed a live credential. That password must be rotated before launch. |
| Security    | All database queries use parameters, never text joined into SQL.                                                                                               | The POST endpoint accepts free text from anonymous users.                                     |
| Performance | The restaurant page loads in under 2 seconds on a mobile connection.                                                                                           | Diners often decide on a phone, and a slow page loses them.                                   |
| Reliability | A failed post shows an error and does not create a partial review.                                                                                             | Diners must trust that what they see was saved.                                               |
| Usability   | The page works on screen widths from 360 px upward.                                                                                                            | The design shows a phone as the client.                                                       |

## Success metrics

| Metric            | How it is measured                                           | Launch target   |
| ----------------- | ------------------------------------------------------------ | --------------- |
| Rating accuracy   | Average shown on the page matches a manual SQL check         | 100% match      |
| Post success rate | Successful posts divided by submit attempts with valid input | 99% or higher   |
| Review conversion | Visitors who post a review divided by unique page visitors   | 5% or higher    |
| Page load time    | 75th percentile load time on mobile, from Vercel analytics   | Under 2 seconds |

The first two metrics are launch gates.

## Assumptions, open questions, and risks

### Open questions

- Should the latest review also appear in the full list, or only in its own section? This PRD
  assumes it appears in both.
- Is a user-facing page needed in this release, or only the API? This PRD assumes one page.

### Assumptions

- Design note 2 reads "descending rate". This PRD treats it as a typo for descending date.
- Next.js is the framework, because the design names Vercel but no framework.
- Reviews are anonymous, because the review table has no user column.

### Risks

| Risk                                                 | Impact                            | Mitigation                                                   |
| ---------------------------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| Exposed database password from the design screenshot | Anyone can read or wipe the data  | Rotate the password in Neon before launch                    |
| Spam or fake reviews, since posting needs no login   | Average rating becomes unreliable | Accept for this release; add rate limiting or login next     |
| Average skewed by very few reviews                   | One review sets the whole score   | Show the review count next to the average in a later release |

## Milestones

- **Database ready.** Create both tables in Neon and load the seed data. Exit check: a SQL
  query returns Ludhiana Burrito and its one review.
- **API ready.** Build and deploy the three endpoints on Vercel. Exit check: each endpoint
  returns the expected response and errors listed in the API contract.
- **Page ready.** Build the restaurant page and review form. Exit check: user stories US-1 to
  US-4 pass on a phone.
- **Launch.** Rotate the database password, confirm both launch-gate metrics pass, and share
  the live link.
