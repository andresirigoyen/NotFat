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
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const { message, userId, userProfile: providedProfile } = body || {};
    console.log('Request body:', { message, userId: userId?.substring(0, 8) + '...' });

    if (!message || !userId) {
      return new Response(JSON.stringify({ error: 'Message and userId are required' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    const supabase = getSupabaseAdmin()

    // Fetch latest user profile directly from DB to ensure 100% sync
    let userProfile = null;
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, first_name, diet_type, nutrition_goal, coach_style')
        .eq('id', userId)
        .single();
      userProfile = profileData;
      console.log('✅ Profile synced from DB:', userProfile?.first_name);
    } catch (e) {
      console.log('Profile not found or error, continuing with fallback');
    }

    // Determinar el tono según coach_style
    const coachStyle = userProfile?.coach_style || 'reto';
const tono = {
      apoyo: 'Siempre positivo y motivador.',
      reto: 'Directo y retador, pero justo.',
      directo: 'Sin filtro. Si fallas, se dice claro.'
    }[coachStyle] || 'Directo y retador, pero justo.';

    // Fetch conversation history (limited to last 3 messages to save tokens)
    let conversationHistory = "";
    try {
      const { data: messages } = await supabase
        .from('coach_messages')
        .select('role, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(3);
      
      if (messages && messages.length > 0) {
        conversationHistory = "\n\nHistorial de conversación:\n";
        for (const msg of messages) {
          const role = msg.role === 'user' ? 'Usuario' : 'Asistente';
          conversationHistory += `- ${role}: ${msg.content}\n`;
        }
        console.log('Conversation history loaded:', messages.length, 'messages');
      }
    } catch (e) {
      console.log('No conversation history found');
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY')
    console.log('API Key exists:', !!apiKey)
    if (!apiKey) {
      console.error('No API key found!');
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured. Please set the secret.')
    }

    const model = 'gemini-1.5-flash'
    console.log('Using model:', model)
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    // OPTIMIZACIÓN: Detectar si es una consulta simple que no necesita IA
    const simpleResponses: Record<string, string> = {
      'hola': '¡Hola! ¿En qué puedo ayudarte hoy con tu nutrición?',
      'holiwis': '¡Hola! ¿En qué puedo ayudarte hoy con tu nutrición?',
      'buenos días': '¡Buenos días! ¿Comenzamos con algo saludable hoy?',
      'buenas': '¡Buenas! ¿En qué te ayudo?',
      'gracias': '¡De nada! Para eso estoy. ¿Algo más?',
      'thanks': '¡De nada! Para eso estoy. ¿Algo más?',
      'ok': '¡Perfecto! ¿Algo más que necesites?',
      'si': '¡Genial! ¿Qué más te gustaría saber?',
      'sí': '¡Genial! ¿Qué más te gustaría saber?',
      'no': '¡Entendido! Pregúntame cuando necesites algo.',
      'adiós': '¡Hasta luego! Remember, small steps every day.',
      'bye': '¡Hasta luego! Remember, small steps every day.',
    };

    // Cache removed to ensure variety and fresh AI responses

    const messageLower = message.toLowerCase().trim();
    if (simpleResponses[messageLower]) {
      console.log('✅ Simple query detected, returning cached response');
      return new Response(JSON.stringify({
        type: 'chat',
        response: simpleResponses[messageLower],
        recipeData: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let userContextStr = ""
    if (userProfile) {
      const parts = []
      if (userProfile.first_name) parts.push(`Nombre: ${userProfile.first_name}`)
      if (userProfile.diet_type) parts.push(`Dieta: ${userProfile.diet_type}`)
      if (userProfile.nutrition_goal) parts.push(`Objetivo: ${userProfile.nutrition_goal}`)
      userContextStr = "\n\nContexto del usuario:\n- " + parts.join("\n- ")
    }

    const prompt = `Eres NotFat AI, un experto nutricionista de clase mundial y especialista en salud metabólica.
    FECHA ACTUAL: ${new Date().toLocaleDateString()}
    HORA ACTUAL: ${new Date().toLocaleTimeString()}
    ${userContextStr}
    ${conversationHistory}
    
    TU MISIÓN: Ayudar al usuario a alcanzar su peso ideal y optimizar su nutrición mediante consejos basados en ciencia, planes de comidas creativos y motivación disruptiva pero profesional.
    
    ESTILO DE RESPUESTA:
    - Tono: ${tono}
    - NUNCA insultes ni seas grosero. Sé exigente pero siempre con el objetivo de ayudar.
    - Si el usuario pregunta por ALMUERZO, COMIDA, CENA, DESAYUNO o IDEAS PARA COMER, DEBES usar "type": "recipe" obligatoriamente.
    - Enfoque 100% Nutricional: Tus consejos deben centrarse en macros (proteína, grasas, carbohidratos), densidad nutricional e hidratación.
    - Varía SIEMPRE tus sugerencias. Sé creativo y ofrece opciones de diferentes culturas.
    
    Responde UNICAMENTE con este formato JSON:
    {
      "type": "chat" | "recipe",
      "response": "tu respuesta natural en español",
      "recipeData": {
        "name": "nombre del plato",
        "description": "breve descripcion",
        "ingredients": ["ing 1", "ing 2"],
        "instructions": ["paso 1", "paso 2"],
        "nutrition": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
        "time": 20,
        "difficulty": "Facil"
      }
    }
    Si no es comida, recipeData es null y type es "chat".`

    let responseText = '';
    let aiResponse;
    try {
      console.log('Calling Gemini API...');
      aiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topP: 0.9,
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
          }
        })
      })

      console.log('Gemini response status:', aiResponse.status);

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text()
        console.error('Gemini Error:', aiResponse.status, errorText)
        return new Response(JSON.stringify({ 
          error: `Gemini API error: ${aiResponse.status}`, 
          details: errorText 
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }

      const responseBody = await aiResponse.json()
      console.log('Gemini response:', JSON.stringify(responseBody).substring(0, 200));
      
      responseText = responseBody.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || ''
      
      if (!responseText) {
        console.error('Empty response from Gemini');
        return new Response(JSON.stringify({ 
          error: 'Empty response from Gemini',
          body: responseBody
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
      
      console.log('Response text:', responseText.substring(0, 100));
    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError);
      return new Response(JSON.stringify({ 
        error: `Fetch failed: ${fetchError.message}` 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      });
    }
    
    let parsed;
    try {
      let cleanJson = responseText.replace(/```json|```/g, '').trim();
      const startIdx = cleanJson.indexOf('{');
      const endIdx = cleanJson.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleanJson = cleanJson.substring(startIdx, endIdx + 1);
      }
      parsed = JSON.parse(cleanJson);
      
      // Asegurarse de que la respuesta no sea un JSON crudo accidentalmente
      if (parsed.response && (parsed.response.startsWith('{') || parsed.response.includes('"type":'))) {
        parsed.response = "Aquí tienes una sugerencia personalizada para tu objetivo nutricional.";
      }
    } catch (e) {
      console.warn('Failed to parse AI JSON, falling back to chat');
      // Extraer solo texto legible si el JSON falló y está truncado
      let safeResponse = responseText.replace(/{|}|"type":|"response":|"recipeData":/g, '').trim();
      if (safeResponse.length > 300) safeResponse = safeResponse.substring(0, 300) + "...";
      
      parsed = { 
        type: 'chat', 
        response: safeResponse || 'Lo siento, tuve un problema procesando la receta. ¿Podemos intentarlo de nuevo?', 
        recipeData: null 
      };
    }

    // Message persistence is handled by the frontend useSendMessage hook
    // to avoid duplication and allow for richer metadata/offline handling.

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error in process-prompt:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500 
    })
  }
})