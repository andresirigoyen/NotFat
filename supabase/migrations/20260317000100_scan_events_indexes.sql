-- Migration: add indexes to support scanned calories analytics
-- Fecha: 2026-03-17
-- Objetivo:
-- - Mejorar rendimiento de las vistas:
--   - daily_calories_with_scanned_ratio
--   - weekly_scanned_calories
--   - top_scanned_products_by_calories
-- - Sin tocar tipos de columnas ni datos existentes.

-- IMPORTANTE:
-- Esta migración asume que las tablas base ya existen:
-- - meals
-- - food_items
-- - profiles
-- - scan_events (definida en scripts/analytics_scanned_calories_views.sql)

-- Índice para acelerar joins y filtros por usuario/fecha en meals
CREATE INDEX IF NOT EXISTS idx_meals_user_created_at
  ON meals (user_id, created_at);

-- Índice para acelerar joins por meal_id y filtro por scanned en food_items
CREATE INDEX IF NOT EXISTS idx_food_items_meal_scanned
  ON food_items (meal_id, scanned);

-- Índice básico en scan_events para posibles usos futuros (user + fecha)
CREATE INDEX IF NOT EXISTS idx_scan_events_user_created_at
  ON scan_events (user_id, created_at);

