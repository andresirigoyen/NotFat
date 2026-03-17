import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SendPushBody = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  channelId?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as Partial<SendPushBody>;

    if (!payload.userId) throw new Error("userId requerido");
    if (!payload.title) throw new Error("title requerido");
    if (!payload.body) throw new Error("body requerido");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configurados");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("expo_push_token")
      .eq("id", payload.userId)
      .single();

    if (profileErr) throw profileErr;
    const token = profile?.expo_push_token as string | null;
    if (!token) {
      return new Response(
        JSON.stringify({ ok: false, skipped: true, reason: "no_expo_push_token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // Expo Push API
    const expoMessage = {
      to: token,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: payload.sound ?? "default",
      channelId: payload.channelId,
    };

    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expoMessage),
    });

    const expoJson = await expoRes.json();

    // Log en notification_logs (schema: notification_type simple_reminder)
    await supabase.from("notification_logs").insert({
      user_id: payload.userId,
      notification_type: "simple_reminder",
      reminder_id: null,
    });

    return new Response(
      JSON.stringify({ ok: true, expo: expoJson }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: any) {
    console.error("Error in send-push:", error?.message || error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Internal error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});

