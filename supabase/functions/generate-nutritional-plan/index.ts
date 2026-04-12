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
    const { metadata: clientMetadata } = await req.json().catch(() => ({}));
    
    // 🛡️ SECURITY: Validar identidad real vía JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header is required' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    console.log('🔑 [gen-plan] Token received (last 10 chars):', token.substring(token.length - 10));
    
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

    // 1. Fetch user data from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    // Si no hay perfil, creamos un fallback para evitar el crash del onboarding
    const safeProfile = profile || {
      first_name: 'Usuario',
      gender: 'other',
      birth_date: '1990-01-01',
      height_value: 170,
      weight_value: 70,
      height_unit: 'cm',
      weight_unit: 'kg',
      activity_level: 'moderate',
      diet_type: 'balanced',
      onboarding_metadata: { allergies: [] },
      traffic_source: 'direct'
    };

    // 2. Prepare AI Prompt
    const calculateAge = (birthDate: string) => {
      const birth = new Date(birthDate);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
      return age;
    };

    const full_name = safeProfile.first_name || 'Usuario';
    const age = safeProfile.birth_date ? calculateAge(safeProfile.birth_date) : 30;
    const gender = safeProfile.gender || 'otro';
    const height_cm = safeProfile.height_value || 170;
    const current_weight_kg = safeProfile.weight_value || 70;
    const target_weight_kg = safeProfile.target_weight_kg || current_weight_kg;
    const goal_type = safeProfile.nutrition_goal || 'mantenimiento';
    const activity_level = safeProfile.activity_level || 'sedentario';
    const diet_type = safeProfile.diet_type || 'balanceada';
    const work_schedule = safeProfile.work_schedule || 'horario regular';
    const hunger_trigger = safeProfile.hunger_trigger || 'hambre fisiológica';
    const weekend_struggle = safeProfile.weekend_struggle || 'vida social';
    
    // Captura de datos de seguridad y atribución
    const allergies = safeProfile.onboarding_metadata?.allergies || [];
    const traffic_source = safeProfile.traffic_source || 'directo';

    const systemPrompt = `Actúa como un Nutricionista Clínico y experto en Psicología Conductual. Tu tarea es procesar los datos de un nuevo usuario para generar un plan de nutrición y hábitos que sea científicamente preciso y psicológicamente motivador. `;
    
    const userPrompt = `
User Inputs (Extraídos de Supabase):
Nombre: ${full_name}
Atribución: El usuario llegó vía ${traffic_source}.
Físico: ${age} años, ${gender}, ${height_cm}cm, ${current_weight_kg}kg.
Objetivo: ${goal_type} para llegar a ${target_weight_kg}kg.
Estilo de Vida: ${activity_level}, dieta ${diet_type}, trabaja en ${work_schedule}.
SEGURIDAD CLÍNICA (Alergias): ${allergies.length > 0 ? allergies.join(', ') : 'Ninguna'}.
Barreras Identificadas: Come por ${hunger_trigger}, le cuesta los fines de semana: ${weekend_struggle}.

Requerimientos de Salida (JSON Estricto):
1. Cálculos: TDEE (Mifflin-St Jeor), objetivo calórico diario (ajustado +/- 15% según meta) y macros (P/C/F).
2. SEGURIDAD: Los consejos NUNCA deben sugerir alimentos que coincidan con las alergias del usuario.
3. Informe de Predicción de Éxito: Basado en su perfil psicológico, calcula un % de probabilidad de éxito. En "mensaje_analisis", menciona específicamente cómo su compromiso con sus metas y su canal de origen (${traffic_source}) influyen positivamente.
4. Insights Conductuales: 3 consejos prácticos basados específicamente en sus disparadores (triggers).

Responde ÚNICAMENTE con un JSON en este formato:
{
  "plan_nutricional": {
    "calorias_objetivo": number,
    "macros": { "proteina_g": number, "carbos_g": number, "grasas_g": number },
    "semanas_estimadas": number
  },
  "estrategia_conductual": {
    "hack_fines_de_semana": "string",
    "manejo_de_entorno": "string",
    "tip_motivacional_personalizado": "string"
  },
  "prediccion_exito": {
    "porcentaje": number,
    "barrera_principal": "string",
    "mensaje_analisis": "string"
  }
}`;

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    const model = 'gemini-1.5-flash'
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + userPrompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    })

    const result = await response.json()
    const aiResponse = JSON.parse(result.candidates[0].content.parts[0].text)

    // 🧠 SAFETY VALIDATION: Clinically safe minimums
    // 1200 kcal for women, 1500 kcal for men
    const minCals = gender === 'female' ? 1200 : 1500;
    if (aiResponse.plan_nutricional.calorias_objetivo < minCals) {
      console.warn(`🛡️ AI suggested ${aiResponse.plan_nutricional.calorias_objetivo} kcal, raising to safe minimum ${minCals} kcal.`);
      aiResponse.plan_nutricional.calorias_objetivo = minCals;
      aiResponse.plan_nutricional.nota_seguridad = `Se ha ajustado tu objetivo calórico al mínimo de seguridad metabólica (${minCals} kcal) para proteger tu salud y asegurar energía suficiente.`;
    }

    // 3. Save result back to profiles and goals tables
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        nutritional_plan: aiResponse,
        onboarding_completed: true,
        onboarding_step: 'completed',
        daily_calorie_target: aiResponse.plan_nutricional.calorias_objetivo
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 🧠 SYNC: Insert record into nutrition_goals for Dashboard visibility
    await supabase.from('nutrition_goals').insert({
      user_id: userId,
      calories: aiResponse.plan_nutricional.calorias_objetivo,
      protein: aiResponse.plan_nutricional.macros.proteina_g,
      carbs: aiResponse.plan_nutricional.macros.carbos_g,
      fat: aiResponse.plan_nutricional.macros.grasas_g,
      fiber: Math.round(aiResponse.plan_nutricional.calorias_objetivo * 0.012),
      is_active: true,
      start_date: new Date().toISOString(),
      source: 'ia'
    });

    // 🧠 SYNC: Insert record into hydration_goals
    const hydrationTarget = Math.round((current_weight_kg || 70) * 35);
    await supabase.from('hydration_goals').insert({
      user_id: userId,
      target: hydrationTarget,
      target_unit: 'ml',
      start_date: new Date().toISOString()
    });

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating plan:', error)
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
