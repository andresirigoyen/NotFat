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
    const { imageUrl } = await req.json()

    // 🛡️ SECURITY: Validar identidad real vía JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    console.log('🔑 [analyze-meal] Token received (last 10 chars):', token.substring(token.length - 10));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { 
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
      supabase.from('user_usage').select('scans_count').eq('user_id', userId).eq('usage_date', today).maybeSingle()
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

    // Usar gemini-1.5-flash para máxima velocidad y precisión visual
    const model = 'gemini-1.5-flash'
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    // 🛡️ DESCARGAR LA IMAGEN Y CONVERTIR A BASE64 (Gemini requiere los bytes, no la URL)
    console.log('[analyze-meal] Fetching image for base64 conversion:', imageUrl);
    const imageRes = await fetch(imageUrl);
    const imageBlob = await imageRes.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBlob)));

    const prompt = `Actúa como un Analista Nutricional Visual de Precisión con capacidad de detección espacial. Tu objetivo es identificar EXACTAMENTE lo que hay en la imagen y su ubicación.
    
    PASOS DE ANÁLISIS:
    1. Identifica las formas y texturas principales.
    INSTRUCCIONES:
    1. Analiza cada componente del plato.
    2. Devuelve los ingredientes y sus cuadros de detección (box_2d) en formato [ymin, xmin, ymax, xmax] escala 0-1000.
    
    FORMATO DE RESPUESTA (JSON):
    {
      "summary": "Resumen nutricional corto",
      "ingredients": [
        {
          "name": "Nombre alimento",
          "calories": kcal,
          "protein": g,
          "carbs": g,
          "fat": g,
          "box_2d": [ymin, xmin, ymax, xmax]
        }
      ],
      "totalNutrition": { "calories": X, "protein": X, "carbs": X, "fat": X }
    }
    
    IMPORTANTE: Si no estás seguro, estima de forma realista basándote en el tamaño relativo.`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { 
              inline_data: { 
                mime_type: 'image/jpeg', 
                data: base64Image
              } 
            }
          ]
        }],
        generation_config: {
          temperature: 0.2,
          top_p: 0.95,
          max_output_tokens: 2048,
          response_mime_type: "application/json"
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🛑 Gemini API Error Response:', errorText);
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

    // 2. Increment daily usage counter in DB (Optional, don't crash analysis if fails)
    try {
      console.log(`[analyze-meal] Incrementing usage for ${userId}`);
      const { error: rpcError } = await supabase.rpc('increment_user_usage', {
        target_user_id: userId,
        column_name: 'scans_count'
      });
      if (rpcError) console.error('[analyze-meal] RPC Error:', rpcError);
    } catch (e) {
      console.warn('[analyze-meal] Usage counter increment failed (non-critical):', e);
    }

    // Solo devolvemos el análisis al frontend para que el usuario confirme
    console.log('[analyze-meal] Returning analysis result to client');
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('🛑 ERROR in analyze-meal:', error.message)
    // Return 200 with success: false so Supabase JS doesn't truncate the error message
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal Server Error',
        details: 'Revisa los logs de Supabase para más información.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
