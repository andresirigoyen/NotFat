import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const id = url.searchParams.get("id") || url.searchParams.get("data.id");

    if (topic === "payment") {
      const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      if (!mpAccessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado");

      // 1. Consultar el estado del pago en MercadoPago
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      });
      const payment = await response.json();

      if (payment.status === "approved") {
        const subscriptionId = payment.external_reference;

        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        // 2.a Obtener suscripción para conocer user_id y plan
        const { data: subscription, error: subErr } = await supabaseClient
          .from("subscriptions")
          .select("*")
          .eq("id", subscriptionId)
          .single();

        if (subErr) throw subErr;
        const userId = subscription.user_id;

        // 2.b Activar suscripción y registrar pago
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 30); // default mensual

        const { error: updSubErr } = await supabaseClient
          .from("subscriptions")
          .update({
            status: "active",
            mercadopago_id: String(payment.id),
            provider_subscription_id: payment.order?.id ? String(payment.order.id) : null,
            payment_provider: "mercadopago",
            end_date: endDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscriptionId);

        if (updSubErr) throw updSubErr;

        const amount = payment.transaction_amount ?? subscription.amount ?? 0;
        const currency = payment.currency_id ?? subscription.currency ?? "CLP";
        const paymentDate =
          payment.date_approved ?? payment.date_created ?? new Date().toISOString();

        const { error: payErr } = await supabaseClient.from("payments").insert({
          user_id: userId,
          subscription_id: subscriptionId,
          mercadopago_payment_id: String(payment.id),
          status: payment.status,
          status_detail: payment.status_detail ?? null,
          payment_type: payment.payment_type_id ?? null,
          amount,
          currency,
          payment_date: paymentDate,
          last_modified: payment.date_last_updated ?? new Date().toISOString(),
          payment_data: payment,
          operation_type: payment.operation_type ?? null,
        });

        if (payErr) throw payErr;

        const { error: updProfileErr } = await supabaseClient
          .from("profiles")
          .update({
            subscription_status: "pro",
            subscription_ends_at: endDate.toISOString(),
          })
          .eq("id", userId);

        if (updProfileErr) throw updProfileErr;

        // 3. Analytics de pagos (payments_analytics)
        const analyticsRow = {
          user_id: userId,
          event_type: "subscription_purchase" as const,
          is_chilean: payment?.payer?.identification?.type === "CUIT" ? true : null,
          ab_test_group: null,
          plan_type: subscription.plan_type ?? null,
          payment_method: payment.payment_type_id ?? null,
          transaction_id: String(payment.id),
          amount,
          currency,
          is_successful: true,
          error_message: null,
          error_code: null,
          platform: "mercadopago",
          app_version: null,
          metadata: {
            status_detail: payment.status_detail,
            external_reference: payment.external_reference,
          },
        };

        const { error: analyticsErr } = await supabaseClient
          .from("payments_analytics")
          .insert(analyticsRow);
        if (analyticsErr) {
          console.error("payments_analytics insert error:", analyticsErr.message);
        }

        console.log(`Suscripción activada: user=${userId} sub=${subscriptionId}`);
      }
    }

    return new Response("ok", { status: 200 });
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return new Response(error.message, { status: 400 });
  }
});

