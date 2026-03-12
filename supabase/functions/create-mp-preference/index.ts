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
    const { planType, userId, email } = await req.json()
    
    const mpAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    const price = planType === 'yearly' ? 79990 : 9990

    const body = {
      items: [
        {
          title: `Suscripción NotFat Premium - ${planType === 'yearly' ? 'Anual' : 'Mensual'}`,
          quantity: 1,
          unit_price: price,
          currency_id: "CLP", // Chile por defecto, ajustable
        }
      ],
      payer: {
        email: email
      },
      back_urls: {
        success: "notfat://subscription/success",
        failure: "notfat://subscription/failure",
        pending: "notfat://subscription/pending"
      },
      auto_return: "approved",
      external_reference: userId,
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

    return new Response(JSON.stringify({ init_point: data.init_point }), {
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
