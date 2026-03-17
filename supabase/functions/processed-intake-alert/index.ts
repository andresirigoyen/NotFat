import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AlertBody = {
  userId: string;
  thresholdPct?: number; // e.g. 40 => 40%
  days?: number;         // e.g. 3 consecutive days
  dryRun?: boolean;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as AlertBody;
    const userId = body.userId;
    const thresholdPct = typeof body.thresholdPct === "number" ? body.thresholdPct : 40;
    const days = typeof body.days === "number" ? body.days : 3;
    const dryRun = !!body.dryRun;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId requerido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configurados");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Leer últimos N días desde la vista daily_calories_with_scanned_ratio
    const { data: rows, error } = await supabase
      .from("daily_calories_with_scanned_ratio")
      .select("day, total_calories, scanned_calories, scanned_calories_ratio")
      .eq("user_id", userId)
      .order("day", { ascending: false })
      .limit(days);

    if (error) throw error;

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, triggered: false, reason: "no_data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const threshold = thresholdPct / 100;
    const allAbove = rows.length === days && rows.every((r) => {
      const ratio = Number(r.scanned_calories_ratio || 0);
      return ratio >= threshold;
    });

    if (!allAbove) {
      return new Response(
        JSON.stringify({ ok: true, triggered: false, reason: "threshold_not_met", rows }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({ ok: true, triggered: true, dryRun: true, rows }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // Enviar push usando la función send-push
    const sendPushUrl = `${supabaseUrl}/functions/v1/send-push`;
    const pushRes = await fetch(sendPushUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        userId,
        title: "Muchos procesados en tu dieta",
        body:
          "Veo que varios días tus calorías vienen de productos procesados. ¿Quieres que te sugiera alternativas más saludables?",
        data: {
          type: "processed_intake_alert",
          deepLink: "notfat://coach?action=processed_intake",
        },
        channelId: "updates",
      }),
    });

    const pushJson = await pushRes.json().catch(() => ({}));

    return new Response(
      JSON.stringify({ ok: true, triggered: true, rows, push: pushJson }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: any) {
    console.error("Error in processed-intake-alert:", error?.message || error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Internal error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});

