import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getSupabaseAdmin } from "../_shared/db.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl, userId } = await req.json()

    if (!imageUrl || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: imageUrl and userId' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured')
    }

    // Usar gemini-2.5-flash tal como solicitó el usuario
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const prompt = `Analiza esta imagen de comida y devuelve un JSON estricto con la siguiente estructura:
    {
      "name": "Nombre descriptivo del plato en español",
      "calories": calorias_totales_estimadas,
      "macros": {
        "protein": gramos_proteina,
        "carbs": gramos_carbohidratos,
        "fat": gramos_grasa
      },
      "ingredients": [
        {
          "name": "nombre del ingrediente",
          "calories": calorias,
          "protein": proteina,
          "carbs": carbohidratos,
          "fat": grasa
        }
      ],
      "health_score": puntuacion_1_a_10,
      "explanation": "Breve explicación de por qué es saludable o no"
    }
    IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON, nada de texto extra.`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { 
              inline_data: {
                mime_type: "image/jpeg",
                data: await fetch(imageUrl).then(r => r.arrayBuffer()).then(buf => 
                  btoa(String.fromCharCode(...new Uint8Array(buf)))
                )
              }
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('No se pudo generar un análisis para esta imagen.')
    }

    const content = result.candidates[0].content.parts[0].text
    const cleanContent = content.replace(/```json|```/g, '').trim()
    const analysis = JSON.parse(cleanContent)

    // Solo devolvemos el análisis al frontend para que el usuario confirme
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error in analyze-meal:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
