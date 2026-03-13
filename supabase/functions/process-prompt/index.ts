import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🚀 process-prompt function called')
  
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

    // Prompt inteligente que detecta intención y devuelve estructura unificada
    const prompt = `Eres NotFat AI, un asistente nutricional experto.

Analiza este mensaje del usuario: "${message}"

Determina si el usuario quiere:
1. Una conversación/chat normal sobre nutrición
2. Una receta o ideas de cocina

Responde SIEMPRE en formato JSON con esta estructura:
{
  "type": "chat" | "recipe",
  "response": "tu respuesta en texto natural",
  "recipeData": {
    "name": "nombre del plato (si type=recipe)",
    "description": "descripción breve",
    "ingredients": ["ingrediente 1", "ingrediente 2"],
    "instructions": ["paso 1", "paso 2"],
    "nutrition": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
    "time": 30,
    "difficulty": "Fácil"
  }
}

Si type="chat", recipeData puede ser null.
Si type="recipe", incluye todos los datos de la receta.

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
          maxOutputTokens: 1000,
          candidateCount: 1,
        }
      })
    })

    console.log('📡 API Response status:', response.status)
    
    // Timeout de 20 segundos
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout de 20 segundos')), 20000)
    })

    const result = await Promise.race([response.json(), timeoutPromise])
    console.log('📊 API Result received')
    
    if (!result.candidates || result.candidates.length === 0) {
      console.log('❌ No candidates in response')
      throw new Error('No se obtuvo respuesta de Gemini')
    }

    const responseText = result.candidates[0].content.parts[0].text
    console.log('✅ Response text generated:', responseText.substring(0, 100) + '...')

    // Parsear el JSON de la respuesta
    let parsedResponse;
    try {
      const cleanContent = responseText.replace(/```json|```/g, '').trim()
      parsedResponse = JSON.parse(cleanContent)
    } catch (parseError: any) {
      console.error('❌ Error parsing JSON:', parseError)
      // Si no es JSON válido, tratar como chat normal
      parsedResponse = {
        type: 'chat',
        response: responseText.trim(),
        recipeData: null
      }
    }

    return new Response(JSON.stringify({ 
      type: parsedResponse.type,
      response: parsedResponse.response,
      recipeData: parsedResponse.recipeData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('❌ Error en process-prompt:', error)
    
    // Extraer message del error si es posible
    let userMessage = ''
    try {
      const body = await req.clone().json()
      userMessage = body.message || ''
    } catch (e) {
      userMessage = ''
    }
    
    // Fallback response
    const fallbackResponse = getFallbackResponse(userMessage)
    console.log('🔄 Using fallback response')
    
    return new Response(JSON.stringify({ 
      type: 'chat',
      response: fallbackResponse,
      recipeData: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})

// Fallback responses comunes
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('hola') || lowerMessage.includes('buenos')) {
    return "¡Hola! Soy tu coach nutricional NotFat. ¿En qué puedo ayudarte hoy?"
  }
  
  if (lowerMessage.includes('receta') || lowerMessage.includes('cocinar') || lowerMessage.includes('cenar') || lowerMessage.includes('comer')) {
    return "Puedo ayudarte con recetas deliciosas. ¿Qué ingredientes tienes disponibles?"
  }
  
  if (lowerMessage.includes('peso') || lowerMessage.includes('bajar') || lowerMessage.includes('dieta')) {
    return "Para un peso saludable, combina alimentación balanceada con ejercicio. Come cada 3-4 horas, incluye proteína en cada comida y mantente hidratado."
  }
  
  return "Soy tu asistente nutricional NotFat. Puedo ayudarte con recetas, consejos de alimentación y planes personalizados. ¿Qué te gustaría saber?"
}
