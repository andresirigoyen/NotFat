import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SchedulerBody = {
  dryRun?: boolean;
  // How many minutes of tolerance around the target time.
  windowMinutes?: number;
  // Limit users processed per run.
  limit?: number;
};

type PrefRow = {
  id: string;
  user_id: string;
  hour: number;
  minute: number;
  enabled: boolean;
  meal_type?: "breakfast" | "lunch" | "dinner" | "snack" | null;
  is_custom?: boolean | null;
  label?: string | null;
  message?: string | null;
  icon?: string | null;
  predefined_type?: string | null;
};

function getLocalTimeParts(date: Date, timeZone: string): { hour: number; minute: number; ymd: string } {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  return { hour, minute, ymd: `${year}-${month}-${day}` };
}

function withinWindow(nowMin: number, targetMin: number, window: number) {
  return Math.abs(nowMin - targetMin) <= window;
}

function buildNotificationFromPreference(pref: PrefRow) {
  const type = (pref.predefined_type || "").toLowerCase();
  const isMeal = type === "meal_reminder" || !!pref.meal_type;
  const isWater = type === "water_reminder" || type === "hydration_reminder";
  const isDaily = type === "daily_summary";

  // Allow custom overrides from DB
  const titleOverride = pref.label?.trim();
  const bodyOverride = pref.message?.trim();
  const icon = pref.icon?.trim();

  if (isDaily) {
    return {
      title: titleOverride || "📊 Resumen del día",
      body: bodyOverride || "Revisa tu progreso de hoy en NotFat.",
      data: { type: "daily_summary", deepLink: "notfat://progress" },
      channelId: "updates",
    };
  }

  if (isWater) {
    return {
      title: titleOverride || `${icon ? icon + " " : ""}Hidrátate`,
      body: bodyOverride || "Es hora de tomar agua y registrar tu hidratación.",
      data: { type: "hydration_reminder", deepLink: "notfat://water?action=log" },
      channelId: "hydration-reminders",
    };
  }

  if (isMeal) {
    const meal = pref.meal_type || "meal";
    const mealMap: Record<string, { title: string; body: string }> = {
      breakfast: { title: "¡Hora del desayuno! 🍳", body: "Registra tu desayuno en NotFat." },
      lunch: { title: "¡Hora del almuerzo! 🥗", body: "Registra tu almuerzo en NotFat." },
      dinner: { title: "¡Hora de la cena! 🍽️", body: "Registra tu cena en NotFat." },
      snack: { title: "¡Hora del snack! 🍎", body: "Registra tu snack en NotFat." },
      meal: { title: "🍽️ Recordatorio", body: "Recuerda registrar tu comida en NotFat." },
    };
    const base = mealMap[meal] || mealMap.meal;
    return {
      title: titleOverride || `${icon ? icon + " " : ""}${base.title}`,
      body: bodyOverride || base.body,
      data: { type: "meal_reminder", mealType: meal, deepLink: "notfat://meal?action=log" },
      channelId: "meal-reminders",
    };
  }

  // Generic fallback
  return {
    title: titleOverride || "NotFat",
    body: bodyOverride || "Tienes una notificación pendiente.",
    data: { type: "simple_reminder" },
    channelId: "updates",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as SchedulerBody;
    const dryRun = !!body.dryRun;
    const windowMinutes = typeof body.windowMinutes === "number" ? body.windowMinutes : 2;
    const limit = typeof body.limit === "number" ? body.limit : 500;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configurados");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const now = new Date();

    // We schedule based on notification_preferences.
    // Supported:
    // - predefined_type = daily_summary
    // - predefined_type = meal_reminder + meal_type
    // - predefined_type = water_reminder / hydration_reminder
    const { data: prefs, error: prefErr } = await supabase
      .from("notification_preferences")
      .select("id, user_id, hour, minute, enabled, meal_type, is_custom, label, message, icon, predefined_type")
      .eq("enabled", true)
      .limit(limit);

    if (prefErr) throw prefErr;

    const prefRows = (prefs ?? []) as PrefRow[];

    // Fetch profiles in batch
    const userIds = [...new Set(prefRows.map((p: any) => p.user_id as string))];
    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, skipped: 0, reason: "no_preferences" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, expo_push_token, timezone")
      .in("id", userIds);

    if (profErr) throw profErr;

    const profileById = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));

    let sent = 0;
    let skipped = 0;
    const results: any[] = [];

    for (const pref of prefRows) {
      const profile = profileById.get(pref.user_id);
      const token = profile?.expo_push_token as string | null;
      const timeZone = (profile?.timezone as string) || "UTC";

      if (!token) {
        skipped++;
        results.push({ userId: pref.user_id, preferenceId: pref.id, skipped: "no_token" });
        continue;
      }

      const local = getLocalTimeParts(now, timeZone);
      const nowMin = local.hour * 60 + local.minute;
      const targetMin = Number(pref.hour) * 60 + Number(pref.minute);

      if (!withinWindow(nowMin, targetMin, windowMinutes)) {
        skipped++;
        results.push({ userId: pref.user_id, preferenceId: pref.id, skipped: "not_in_window", localTime: `${local.hour}:${local.minute}` });
        continue;
      }

      // Dedup by preference + day (UTC day). Pragmatic guard.
      const utcYmd = now.toISOString().slice(0, 10);
      const startUtc = new Date(`${utcYmd}T00:00:00.000Z`).toISOString();
      const endUtc = new Date(`${utcYmd}T23:59:59.999Z`).toISOString();

      const { data: existingLogs, error: logErr } = await supabase
        .from("notification_logs")
        .select("id")
        .eq("user_id", pref.user_id)
        .eq("reminder_id", pref.id)
        .gte("sent_at", startUtc)
        .lte("sent_at", endUtc)
        .limit(1);

      if (logErr) throw logErr;
      if (existingLogs && existingLogs.length > 0) {
        skipped++;
        results.push({ userId: pref.user_id, preferenceId: pref.id, skipped: "already_sent_today" });
        continue;
      }

      if (dryRun) {
        sent++;
        results.push({ userId: pref.user_id, preferenceId: pref.id, dryRun: true, predefined_type: pref.predefined_type, meal_type: pref.meal_type });
        continue;
      }

      const built = buildNotificationFromPreference(pref);
      const expoMessage = {
        to: token,
        title: built.title,
        body: built.body,
        data: built.data,
        sound: "default",
        channelId: built.channelId,
      };

      const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expoMessage),
      });

      const expoJson = await expoRes.json();

      await supabase.from("notification_logs").insert({
        user_id: pref.user_id,
        notification_type: "simple_reminder",
        reminder_id: pref.id,
      });

      sent++;
      results.push({
        userId: pref.user_id,
        preferenceId: pref.id,
        tz: timeZone,
        localDate: local.ymd,
        expo: expoJson,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, sent, skipped, windowMinutes, dryRun, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: any) {
    console.error("Error in push-scheduler:", error?.message || error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Internal error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});

