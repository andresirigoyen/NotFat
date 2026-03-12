import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

    // Validación de entrada
    if (!imageUrl || !userId) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos: imageUrl y userId' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // 1. Configuración de la API de IA (Gemini 2.0 Flash)
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

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

    const prompt = `Analiza esta imagen de comida y devuelve un JSON con:
    - name: nombre del plato
    - calories: total estimado
    - macros: { protein, carbs, fat } en gramos
    - ingredients: lista de ingredientes detectados
    - health_score: 1-10
    IMPORTANTE: Responde SOLO el JSON sin formato de código.`

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
      throw new Error(`Error en API de Gemini: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('No se obtuvo respuesta de Gemini')
    }

    const content = result.candidates[0].content.parts[0].text
    
    // Limpiar y parsear el JSON
    let analysis;
    try {
      const cleanContent = content.replace(/```json|```/g, '').trim()
      analysis = JSON.parse(cleanContent)
    } catch (parseError) {
      throw new Error(`Error al parsear respuesta de Gemini: ${parseError.message}`)
    }

    // Validar estructura del análisis
    if (!analysis.name || !analysis.calories || !analysis.macros) {
      throw new Error('La respuesta de Gemini no contiene todos los campos requeridos')
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error en analyze-meal:', error)
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
