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

    // Fetch user profile
    let userProfile = providedProfile;
    if (!userProfile) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, first_name, diet_type, nutrition_goal')
          .eq('id', userId)
          .single();
        userProfile = profileData;
      } catch (e) {
        console.log('Profile not found, continuing without context');
        userProfile = null;
      }
    }

    // Fetch conversation history
    let conversationHistory = "";
    try {
      const { data: messages } = await supabase
        .from('coach_messages')
        .select('role, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(20);
      
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

    let userContextStr = ""
    if (userProfile) {
      const parts = []
      if (userProfile.first_name) parts.push(`Nombre: ${userProfile.first_name}`)
      if (userProfile.diet_type) parts.push(`Dieta: ${userProfile.diet_type}`)
      if (userProfile.nutrition_goal) parts.push(`Objetivo: ${userProfile.nutrition_goal}`)
      userContextStr = "\n\nContexto del usuario:\n- " + parts.join("\n- ")
    }

    const prompt = `Eres NotFat AI, un experto coach nutricional.${userContextStr}${conversationHistory}
    
    Mensaje actual del usuario: "${message}"
    
    Responde UNICAMENTE con este JSON exacto:
    {
      "type": "chat" o "recipe",
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
    Si es solo chat, recipeData debe ser null.`

    let responseText = '';
    let aiResponse;
    try {
      console.log('Calling Gemini API...');
      aiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
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
      
      responseText = responseBody.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
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
      const cleanJson = responseText.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(cleanJson)
    } catch (e) {
      console.warn('Failed to parse AI JSON, falling back to chat');
      parsed = { type: 'chat', response: responseText.trim(), recipeData: null }
    }

    try {
      await supabase.from('coach_messages').insert({
        user_id: userId,
        role: 'user',
        content: message
      });
      
      await supabase.from('coach_messages').insert({
        user_id: userId,
        role: 'assistant',
        content: parsed.response,
        metadata: parsed.recipeData ? { recipe: parsed.recipeData } : null
      });
      console.log('Messages saved to DB');
    } catch (dbError: any) {
      console.warn('Failed to save messages:', dbError.message);
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