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
    const { ingredients } = await req.json()

    if (!ingredients) {
      return new Response(
        JSON.stringify({ error: 'Ingredientes requeridos' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Configuración de Gemini
    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_GEMINI_API_KEY no configurada' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const prompt = `Crea una receta saludable con: "${ingredients}"

Responde en JSON con:
- name: nombre del plato
- description: descripción breve
- ingredients: lista con cantidades
- instructions: 3-5 pasos numerados
- nutrition: { calories, protein, carbs, fat }
- time: minutos
- difficulty: "Fácil" o "Medio"

SOLO JSON, sin código.`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 800, // Reducido para mayor velocidad
          candidateCount: 1,
        }
      })
    })

    // Timeout de 20 segundos para recetas
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout de 20 segundos')), 20000)
    })

    const result = await Promise.race([response.json(), timeoutPromise])
    
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('No se obtuvo respuesta de Gemini')
    }

    const content = result.candidates[0].content.parts[0].text
    
    // Limpiar y parsear el JSON
    let recipe;
    try {
      const cleanContent = content.replace(/```json|```/g, '').trim()
      recipe = JSON.parse(cleanContent)
    } catch (parseError: any) {
      throw new Error(`Error al parsear respuesta de Gemini: ${parseError?.message}`)
    }

    return new Response(JSON.stringify({ 
      recipe: recipe 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error en generate-recipe:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error interno del servidor' 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
