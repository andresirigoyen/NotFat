## Push remoto con cron (Supabase)

Este repo ya guarda `profiles.expo_push_token` desde la app y tiene Edge Functions para enviar push.

### Functions disponibles

- `send-push`: envía un push a un `userId`.
- `push-scheduler`: envía notificaciones programadas por usuario (timezone-aware).
  - Implementa:
    - `daily_summary` (`predefined_type = 'daily_summary'`)
    - `meal_reminder` (`predefined_type = 'meal_reminder'` y/o `meal_type`)
    - `water_reminder` / `hydration_reminder` (`predefined_type = 'water_reminder'` o `'hydration_reminder'`)

### Estructura esperada en DB (Prisma)

- `profiles.timezone`: string (ej. `America/Santiago`)
- `profiles.expo_push_token`: token Expo
- `notification_preferences`:
  - `user_id`
  - `hour` / `minute`
  - `enabled`
  - `predefined_type` (ej. `daily_summary`, `meal_reminder`, `water_reminder`)
  - `meal_type` (opcional: `breakfast|lunch|dinner|snack`)
  - `label/message/icon` (opcionales; si existen se usan para personalizar el push)
- `notification_logs`:
  - `user_id`
  - `sent_at` (default now)
  - `notification_type`
  - `reminder_id` (usamos el `id` de `notification_preferences` para deduplicar)

### Cómo programarlo (Scheduled Functions)

En Supabase Dashboard:
1. Ve a **Edge Functions → Scheduled Functions**
2. Programa `push-scheduler` cada **5 minutos**
3. Body recomendado:

```json
{
  "windowMinutes": 2,
  "limit": 500
}
```

### Dry-run (para testear sin enviar)

```json
{
  "dryRun": true,
  "windowMinutes": 10
}
```

### Nota de deduplicación

La deduplicación actual es por `reminder_id` y **día UTC** (pragmático).
Si quieres deduplicación perfecta por día **en timezone del usuario**, se puede ajustar.

