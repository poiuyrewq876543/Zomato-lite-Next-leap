-- Launch seed data: one restaurant and its one review.
-- Idempotent: safe to run more than once.

INSERT INTO restaurant (id, name, location, cuisine, type, created_at)
VALUES (1, 'Ludhiana Burrito', 'Sector 32', 'Indian', 'dine-in', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO review (id, restaurant_id, rating, review, created_at)
VALUES (100, 1, 5, 'great', now())
ON CONFLICT (id) DO NOTHING;

-- Keep identity sequences ahead of the explicit seed ids.
SELECT setval(
  pg_get_serial_sequence('restaurant', 'id'),
  GREATEST((SELECT COALESCE(MAX(id), 0) FROM restaurant), 1)
);

SELECT setval(
  pg_get_serial_sequence('review', 'id'),
  GREATEST((SELECT COALESCE(MAX(id), 0) FROM review), 1)
);
