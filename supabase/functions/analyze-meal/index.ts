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

    // Usar gemini-2.0-flash para análisis de imágenes (más económico)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

    const prompt = `Analiza esta imagen de comida y devuelve un JSON con:
    {
      "name": "Nombre del plato en español",
      "calories": 500,
      "protein": 30,
      "carbs": 50,
      "fat": 20,
      "ingredients": [
        {"name": "ingrediente1", "calories": 100, "protein": 10, "carbs": 20, "fat": 5},
        {"name": "ingrediente2", "calories": 150, "protein": 15, "carbs": 25, "fat": 8}
      ]
    }
    IMPORTANTE: Solo devuelve JSON válido, sin texto adicional.`

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
    let analysis;
    try {
      const cleanContent = content.replace(/```json|```/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse JSON:', content);
      // Try to extract JSON from the text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se pudo parsear el análisis de la imagen');
      }
    }

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
