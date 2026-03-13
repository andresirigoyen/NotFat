import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🚀 ai-chat function called')
  console.log('Method:', req.method)
  
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request handled')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message } = await req.json()
    console.log('📝 Message received:', message)

    if (!message) {
      console.log('❌ No message provided')
      return new Response(
        JSON.stringify({ error: 'Mensaje requerido' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Configuración de Gemini
    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    console.log('🔑 API Key exists:', !!apiKey)
    
    if (!apiKey) {
      console.log('❌ GOOGLE_GEMINI_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'GOOGLE_GEMINI_API_KEY no configurada' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
    console.log('🌐 Calling Gemini API...')

    const prompt = `Eres NotFat AI, un asistente nutricional experto. Responde de manera clara y concisa (máximo 100 palabras).

Usuario pregunta: "${message}"

Responde como un coach nutricional profesional pero cercano. Sé específico y directo.`

    console.log('💭 Prompt prepared, calling API...')
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200, // Reducido para respuestas más rápidas
          candidateCount: 1,
        }
      })
    })

    console.log('📡 API Response status:', response.status)
    
    // Timeout de 15 segundos
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout de 15 segundos')), 15000)
    })

    const result = await Promise.race([response.json(), timeoutPromise])
    console.log('📊 API Result received')
    
    if (!result.candidates || result.candidates.length === 0) {
      console.log('❌ No candidates in response')
      throw new Error('No se obtuvo respuesta de Gemini')
    }

    const responseText = result.candidates[0].content.parts[0].text
    console.log('✅ Response text generated:', responseText.substring(0, 100) + '...')

    return new Response(JSON.stringify({ 
      response: responseText.trim() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('❌ Error en ai-chat:', error)
    
    // Extraer message del error si es posible
    let userMessage = ''
    try {
      const body = await req.clone().json()
      userMessage = body.message || ''
    } catch (e) {
      userMessage = ''
    }
    
    // Fallback response si Gemini falla
    const fallbackResponse = getFallbackResponse(userMessage)
    console.log('🔄 Using fallback response')
    
    return new Response(JSON.stringify({ 
      response: fallbackResponse 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Devolver 200 con fallback
    })
  }
})

// Fallback responses comunes
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('hola') || lowerMessage.includes('buenos')) {
    return "¡Hola! Soy tu coach nutricional NotFat. ¿En qué puedo ayudarte hoy?"
  }
  
  if (lowerMessage.includes('cenar') || lowerMessage.includes('cena')) {
    return "Para una cena saludable, te recomiendo: pollo a la plancha con vegetales asados, o pescado al horno con quinoa. Ambas opciones son ricas y nutritivas."
  }
  
  if (lowerMessage.includes('comida') || lowerMessage.includes('comer')) {
    return "Para comidas balanceadas, enfócate en: proteína magra, vegetales variados y carbohidratos complejos. ¿Te gustaría alguna receta específica?"
  }
  
  if (lowerMessage.includes('peso') || lowerMessage.includes('bajar')) {
    return "Para un peso saludable, combina alimentación balanceada con ejercicio. Come cada 3-4 horas, incluye proteína en cada comida y mantente hidratado."
  }
  
  return "Soy tu asistente nutricional NotFat. Puedo ayudarte con recetas, consejos de alimentación y planes personalizados. ¿Qué te gustaría saber?"
}
