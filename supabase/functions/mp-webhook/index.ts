import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const topic = url.searchParams.get("topic") || url.searchParams.get("type")
    const id = url.searchParams.get("id") || url.searchParams.get("data.id")

    if (topic === "payment") {
      const mpAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
      
      // 1. Consultar el estado del pago en MercadoPago
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { "Authorization": `Bearer ${mpAccessToken}` }
      })
      const payment = await response.json()

      if (payment.status === "approved") {
        const userId = payment.external_reference
        
        // 2. Actualizar el perfil del usuario en Supabase
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error } = await supabaseClient
          .from('profiles')
          .update({ 
            subscription_status: 'Premium',
            // Añadir 30 días o 1 año según el pago si es necesario
          })
          .eq('id', userId)

        if (error) throw error
        console.log(`Suscripción activada para el usuario ${userId}`)
      }
    }

    return new Response("ok", { status: 200 })
  } catch (error) {
    console.error("Webhook Error:", error.message)
    return new Response(error.message, { status: 400 })
  }
})
