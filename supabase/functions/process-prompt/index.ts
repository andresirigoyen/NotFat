import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getSupabaseAdmin } from "../_shared/db.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const { message, userProfile: providedProfile } = body || {};
    console.log('Request received:', { message: message?.substring(0, 20) + '...' });

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // 🛡️ SECURITY: Validar identidad real vía JWT (Cierre de IDOR)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    console.log('🔑 Token received (last 10 chars):', token.substring(token.length - 10));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Cliente para validar al usuario (Importado arriba para evitar latencia)
    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);

    if (authError || !user) {
      console.error('🛑 Auth Error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const userId = user.id;
    const supabase = getSupabaseAdmin()

    // 1. Fetch user tier and usage in parallel for efficiency
    const today = new Date().toISOString().split('T')[0];
    const [profileRes, usageRes] = await Promise.all([
      supabase.from('profiles').select('subscription_tier').eq('id', userId).maybeSingle(),
      supabase.from('user_usage').select('messages_count').eq('user_id', userId).eq('usage_date', today).maybeSingle()
    ]);

    const userProfile = profileRes.data;
    const isPro = userProfile?.subscription_tier === 'pro';
    const usageCount = usageRes.data?.messages_count || 0;

    console.log(`✅ User tier: ${userProfile?.subscription_tier}, Daily AI Messages: ${usageCount}`);

    // SECURE: Enforce Free Tier Limit server-side (5 messages/day)
    if (!isPro && usageCount >= 5) {
      console.warn(`🛑 LIMIT REACHED: User ${userId} is at 5 messages.`);
      return new Response(JSON.stringify({
        error: 'Límite diario de IA alcanzado.',
        code: 'LIMIT_REACHED',
        suggestion: 'Pásate a Pro para disfrutar de conversaciones ilimitadas con el Chef IA.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    // Determinar el tono según coach_style
    type CoachStyle = 'apoyo' | 'reto' | 'directo';
    // 🔒 SERVER-SIDE ENFORCEMENT: Free users are capped to 'apoyo' style only.
    // Even if the profile DB has 'directo', we override here for Free tier.
    const rawStyle = (userProfile?.coach_style || 'apoyo') as CoachStyle;
    const coachStyle: CoachStyle = isPro ? rawStyle : 'apoyo';
    const tono: Record<CoachStyle, string> = {
      apoyo: 'Siempre positivo y motivador. Celebra los logros, usa emojis amigables, nunca critique al usuario.',
      reto: 'Directo y retador, pero justo. Exige esfuerzo, no acepta excusas pero tampoco humilla.',
      directo: 'Sin filtro. Si fallas, se dice claro. Tono duro pero con el objetivo de hacer mejorar.',
    };
    const tonoStr = tono[coachStyle];

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

    const model = 'gemini-2.5-flash'
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

    // Persona System Instruction based on coachStyle
    const systemInstruction = {
      parts: [{
        text: `Eres NotFat AI, un experto nutricionista de clase mundial y especialista en salud metabólica.
        FECHA: ${new Date().toLocaleDateString()}
        
        ${userContextStr}
        
        TU PERSONALIDAD (${coachStyle.toUpperCase()}):
        ${coachStyle === 'apoyo' ?
            'Eres el compañero más alentador. SIEMPRE eres positivo, motivador y empático. Celebras cada progreso. NUNCA eres rudo, ni agresivo, ni criticas negativamente. Tu lenguaje es suave y reconfortante.' :
            coachStyle === 'reto' ?
              'Eres un coach exigente pero justo. Das feedback directo y honesto, pero SIEMPRE eres ÚTIL y construtivo. Ayudas al usuario a alcanzar sus metas con retos realistas y accionables. NUNCA seas sarcástico o despreciativo. SIEMPRE proporciona información práctica y aplicable.' :
              'Eres directo y práctico. Das información clara y útil sin rodeos. Te enfocas en lo que funciona.'
          }
        
        REGLAS OPERATIVAS CRÍTICAS:
        1. Cuando el usuario pida UNA RECETA, suggestions de comida, o qué cocinar:
           - IMMEDIATAMENTE genera una receta útil y específica
           - Usa "type": "recipe" e incluye recipeData completo
           - NO respondas con preguntas ni seas sarcástico
        2. Responde SIEMPRE en formato JSON con los campos "type" ("chat" o "recipe") y "response" (el texto de tu respuesta).
        3. Si el usuario sugiere o pregunta por comida/recetas, USA "type": "recipe" e incluye el objeto "recipeData".
        4. Enfoque: 100% Nutricional (macros, hidratación, metabolismo).
        5. Tono: ${tonoStr}
        6. RECUERDA: ${coachStyle === 'apoyo' ? 'SÉ AMABLE Y APOYANTE.' : 'SÉ DIRECTO PERO ÚTIL. NUNCA SEA SARCÁSTICO.'}`
      }]
    };

    const conversationHistoryStr = conversationHistory ? `Historial reciente:\n${conversationHistory}\n\n` : '';
    const userMessagePart = `${conversationHistoryStr}Usuario dice: ${message}`;

    let responseText = '';
    let aiResponse;
    try {
      console.log('Calling Gemini API (v1beta) with native system instructions...');

      aiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: systemInstruction, // Campo nativo de la API
          contents: [{ parts: [{ text: userMessagePart }] }],
          generationConfig: {
            temperature: coachStyle === 'apoyo' ? 0.7 : 0.9,
            topP: 0.95,
            maxOutputTokens: 2048,
            response_mime_type: "application/json"
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

      // Find the first { and last } to extract just the JSON object
      const startIdx = cleanJson.indexOf('{');
      const endIdx = cleanJson.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleanJson = cleanJson.substring(startIdx, endIdx + 1);
      }

      parsed = JSON.parse(cleanJson);

      // Handle nested JSON in response field - extract if needed
      if (parsed.response) {
        // If response is a JSON string, try to parse it
        const responseStr = typeof parsed.response === 'string' ? parsed.response : JSON.stringify(parsed.response);

        // Check if response contains nested JSON and extract just the text
        if (responseStr.startsWith('{') || responseStr.startsWith('[')) {
          try {
            const nested = JSON.parse(responseStr);
            // If it's a nested recipe object, merge it
            if (nested.name || nested.ingredients) {
              parsed.recipeData = nested;
              parsed.response = `Aquí tienes: ${nested.name || 'esta receta'}`;
            } else {
              parsed.response = "Aquí tienes una sugerencia personalizada para tu objetivo nutricional.";
            }
          } catch {
            // Not valid JSON, keep as is but clean
            parsed.response = responseStr.replace(/[{}\[\]]/g, '').trim().substring(0, 200);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse AI JSON, falling back to chat');
      // Intento de extraer el campo "response" vía regex si el JSON está roto o truncado
      const responseMatch = responseText.match(/"response"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      let safeResponse = '';

      if (responseMatch && responseMatch[1]) {
        safeResponse = responseMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      } else {
        // Si no hay match, limpiamos lo mejor posible
        safeResponse = responseText
          .replace(/```json|```/g, '')
          .replace(/{|}|"type":|"response":|"recipeData":/g, '')
          .trim();
        if (safeResponse.length > 400) safeResponse = safeResponse.substring(0, 400) + "...";
      }

      parsed = {
        type: 'chat',
        response: safeResponse || 'Lo siento, tuve un problema al procesar la respuesta. ¿Puedes intentarlo de nuevo?',
        recipeData: null
      };
    }

    // Final validation - ensure we always return valid JSON with required fields
    if (!parsed.type || !parsed.response) {
      parsed = {
        type: 'chat',
        response: 'Lo siento, no pude procesar tu solicitud correctamente. ¿Puedes intentarlo de nuevo?',
        recipeData: null
      };
    }

    // Ensure recipeData is null if type is not recipe
    if (parsed.type !== 'recipe') {
      parsed.recipeData = null;
    }

    // 2. Increment daily usage counter in DB
    try {
      await supabase.rpc('increment_user_usage', {
        target_user_id: userId,
        column_name: 'messages_count'
      });
      console.log('✅ Usage counter incremented for user:', userId);
    } catch (e) {
      console.error('Failed to increment usage counter:', e);
    }

    // 🧠 MEMORY: Guardar el historial de forma segura (con AWAIT)
    if (parsed.type && message) {
      const { error: historyError } = await supabase.from('coach_messages').insert([
        { user_id: userId, role: 'user', content: message },
        { user_id: userId, role: 'assistant', content: parsed.response }
      ]);

      if (historyError) console.error('❌ Error saving history:', historyError);
      else console.log('✅ Chat history persisted.');
    }

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