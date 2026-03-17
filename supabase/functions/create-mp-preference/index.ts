import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { planType, userId, email, subscriptionId, amount, currency } = await req.json()
    
    const mpAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    if (!mpAccessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado')
    }

    // Pricing source of truth (CLP)
    // - monthly: 4.990
    // - yearly: 29.990
    const inferredPrice = planType === 'yearly' ? 29990 : 4990
    const price = typeof amount === 'number' && amount > 0 ? amount : inferredPrice
    const currencyId = currency || "CLP"
    if (!subscriptionId) {
      throw new Error('subscriptionId requerido')
    }

    const body = {
      items: [
        {
          title: `Suscripción NotFat Premium - ${planType === 'yearly' ? 'Anual' : 'Mensual'}`,
          quantity: 1,
          unit_price: price,
          currency_id: currencyId,
        }
      ],
      payer: {
        email: email
      },
      back_urls: {
        success: `notfat://subscription?result=success&subscriptionId=${subscriptionId}`,
        failure: `notfat://subscription?result=failure&subscriptionId=${subscriptionId}`,
        pending: `notfat://subscription?result=pending&subscriptionId=${subscriptionId}`
      },
      auto_return: "approved",
      external_reference: subscriptionId,
      metadata: {
        user_id: userId,
        plan_type: planType,
        subscription_id: subscriptionId,
      },
      notification_url: `${Deno.env.get('SUPABASE_PROJECT_URL')}/functions/v1/mp-webhook`
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    return new Response(JSON.stringify({ 
      init_point: data.init_point,
      preference_id: data.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
