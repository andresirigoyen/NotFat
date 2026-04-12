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

    const supabase = getSupabaseAdmin()

    // 1. Fetch user tier and usage in parallel for efficiency
    const today = new Date().toISOString().split('T')[0];
    const [profileRes, usageRes] = await Promise.all([
      supabase.from('profiles').select('subscription_tier').eq('id', userId).single(),
      supabase.from('user_usage').select('scans_count').eq('user_id', userId).eq('usage_date', today).single()
    ]);

    const isPro = profileRes.data?.subscription_tier === 'pro';
    const scansCount = usageRes.data?.scans_count || 0;

    console.log(`✅ User tier: ${profileRes.data?.subscription_tier}, Daily Scans: ${scansCount}`);

    // SECURE: Enforce Free Tier Limit server-side (3 scans/day)
    if (!isPro && scansCount >= 3) {
      console.warn(`🛑 LIMIT REACHED: User ${userId} is at 3 scans.`);
      return new Response(JSON.stringify({ 
        error: 'Límite diario de escaneos alcanzado.', 
        code: 'LIMIT_REACHED',
        suggestion: 'Pásate a Pro para disfrutar de escaneos ilimitados.'
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403 
      });
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured')
    }

    // Usar gemini-2.0-flash para consistencia y rendimiento
    const model = 'gemini-2.0-flash'
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const prompt = `Analiza esta imagen y actúa como un experto nutricionista visual. Identifica todos los alimentos presentes.
    
    INSTRUCCIONES CLAVE:
    1. Si no estás seguro al 100%, haz tu mejor estimación basada en colores y texturas (ej. "Proteína cocida", "Vegetales mixtos").
    2. NUNCA devuelvas 0 calorías si ves comida. Estima valores realistas.
    3. Si la imagen es borrosa o difícil, identifica el plato principal (ej. "Plato de carne", "Ensalada variada").
    
    FORMATO DE RESPUESTA (JSON):
    {
      "name": "Nombre descriptivo del plato",
      "calories": 450,
      "protein": 25,
      "carbs": 35,
      "fat": 15,
      "ingredients": [
        {"name": "Ingrediente 1", "calories": 200, "protein": 15, "carbs": 5, "fat": 8},
        {"name": "Ingrediente 2", "calories": 250, "protein": 10, "carbs": 30, "fat": 7}
      ]
    }
    IMPORTANTE: Solo JSON. Sin explicaciones.`

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
        }],
        generationConfig: {
          temperature: 0.4, // Menor temperatura para análisis más preciso
          topP: 0.9,
          responseMimeType: "application/json"
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
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

    const content = result.candidates[0].content.parts.map((p: any) => p.text).join('')
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

    // 2. Increment daily usage counter in DB
    try {
      await supabase.rpc('increment_user_usage', { 
        target_user_id: userId, 
        column_name: 'scans_count' 
      });
      console.log('✅ Usage counter (scan) incremented for user:', userId);
    } catch (e) {
      console.error('Failed to increment usage counter:', e);
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
