import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimal daily summary sender:
// - Finds users with expo_push_token
// - Sends a simple summary notification
// - Logs notification_logs
//
// Intended to be triggered by a scheduler/cron.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configurados");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Pull tokens (limit to avoid timeouts; can be paginated later)
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, expo_push_token")
      .not("expo_push_token", "is", null)
      .limit(500);

    if (profErr) throw profErr;

    const tokens = (profiles ?? [])
      .map((p: any) => ({ userId: p.id as string, token: p.expo_push_token as string }))
      .filter((x) => !!x.token);

    const results: any[] = [];

    for (const t of tokens) {
      const expoMessage = {
        to: t.token,
        title: "📊 Resumen del día",
        body: "Revisa tu progreso de hoy en NotFat.",
        data: { type: "daily_summary", deepLink: "notfat://progress" },
        sound: "default",
        channelId: "updates",
      };

      const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expoMessage),
      });

      const expoJson = await expoRes.json();
      results.push({ userId: t.userId, expo: expoJson });

      await supabase.from("notification_logs").insert({
        user_id: t.userId,
        notification_type: "simple_reminder",
        reminder_id: null,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, sent: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: any) {
    console.error("Error in push-daily-summary:", error?.message || error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Internal error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});

