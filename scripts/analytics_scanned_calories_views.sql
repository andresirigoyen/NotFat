-- Vistas de analítica para calorías de alimentos escaneados
-- Basado en tablas: food_items, meals, profiles, scan_events

-- Tabla base de eventos de escaneo (sin FKs estrictos para evitar conflictos de tipos)
-- IMPORTANTE: si ya existe una tabla scan_events en tu BD, ajusta los tipos allí o elimina esta sección.
CREATE TABLE IF NOT EXISTS scan_events (
  id            text PRIMARY KEY,
  barcode       text NOT NULL,
  origin        text NOT NULL,
  result        text,
  product_name  text,
  processing_ms integer,
  created_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,

  -- Usamos text para máxima compatibilidad con ids existentes
  user_id text NOT NULL,
  meal_id text
);

-- 1) Calorías diarias provenientes de alimentos escaneados por usuario
CREATE OR REPLACE VIEW scanned_foods_calories_daily AS
SELECT
  p.id               AS user_id,
  date(m.created_at) AS day,
  SUM(fi.calories)   AS total_calories_scanned,
  COUNT(DISTINCT fi.id)  AS scanned_items_count,
  COUNT(DISTINCT m.id)   AS meals_with_scanned_items
FROM food_items fi
JOIN meals m
  ON fi.meal_id = m.id
JOIN profiles p
  ON m.user_id = p.id
WHERE fi.scanned = TRUE
GROUP BY p.id, date(m.created_at);


-- 2) Calorías totales del día + ratio provenientes de escaneados
CREATE OR REPLACE VIEW daily_calories_with_scanned_ratio AS
WITH scanned AS (
  SELECT
    p.id              AS user_id,
    date(m.created_at) AS day,
    SUM(fi.calories)  AS scanned_calories
  FROM food_items fi
  JOIN meals m ON fi.meal_id = m.id
  JOIN profiles p ON m.user_id = p.id
  WHERE fi.scanned = TRUE
  GROUP BY p.id, date(m.created_at)
),
total AS (
  SELECT
    p.id              AS user_id,
    date(m.created_at) AS day,
    SUM(fi.calories)  AS total_calories
  FROM food_items fi
  JOIN meals m ON fi.meal_id = m.id
  JOIN profiles p ON m.user_id = p.id
  GROUP BY p.id, date(m.created_at)
)
SELECT
  t.user_id,
  t.day,
  t.total_calories,
  COALESCE(s.scanned_calories, 0) AS scanned_calories,
  CASE
    WHEN t.total_calories > 0 THEN
      COALESCE(s.scanned_calories, 0) / t.total_calories::float
    ELSE 0
  END AS scanned_calories_ratio
FROM total t
LEFT JOIN scanned s
  ON s.user_id = t.user_id
 AND s.day = t.day;


-- 3) Productos escaneados que más calorías aportan (global)
CREATE OR REPLACE VIEW top_scanned_products_by_calories AS
SELECT
  fi.barcode_number,
  fi.name,
  COUNT(*)          AS times_scanned,
  SUM(fi.calories)  AS total_calories_from_scans,
  AVG(fi.calories)  AS avg_calories_per_scan
FROM food_items fi
WHERE fi.scanned = TRUE
GROUP BY fi.barcode_number, fi.name
HAVING COUNT(*) >= 5
ORDER BY total_calories_from_scans DESC;


-- 4) Tendencia semanal de calorías escaneadas por usuario
CREATE OR REPLACE VIEW weekly_scanned_calories AS
SELECT
  user_id,
  date_trunc('week', day)::date AS week_start,
  SUM(scanned_calories)        AS scanned_calories_week,
  SUM(total_calories)          AS total_calories_week,
  CASE
    WHEN SUM(total_calories) > 0
      THEN SUM(scanned_calories) / SUM(total_calories)::float
    ELSE 0
  END                          AS scanned_calories_ratio_week
FROM daily_calories_with_scanned_ratio
GROUP BY user_id, date_trunc('week', day)::date;


-- 5) (Opcional) Vistas basadas en scan_events
-- NOTA: Comentadas porque en algunas bases la tabla física scan_events aún no existe.
-- Si tu tabla scan_events ya está creada en la misma base, puedes descomentar esta sección.
--
-- CREATE OR REPLACE VIEW scan_events_with_calories AS
-- SELECT
--   se.id          AS scan_id,
--   se.created_at,
--   se.origin,
--   se.result,
--   se.processing_ms,
--   se.user_id,
--   fi.calories,
--   fi.name        AS food_name,
--   fi.barcode_number
-- FROM scan_events se
-- LEFT JOIN food_items fi
--   ON se.meal_id = fi.meal_id
--  AND fi.scanned = TRUE;
--
--
-- CREATE OR REPLACE VIEW scan_events_calories_daily AS
-- SELECT
--   date(created_at)                                  AS scan_date,
--   origin,
--   COUNT(*)                                          AS scan_count,
--   COUNT(*) FILTER (WHERE calories IS NOT NULL)      AS scans_with_calories,
--   AVG(calories)                                     AS avg_calories_per_scanned_item,
--   SUM(calories)                                     AS total_scanned_calories
-- FROM scan_events_with_calories
-- GROUP BY date(created_at), origin;

