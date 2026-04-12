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
    const { userId } = await req.json()
    const supabase = getSupabaseAdmin()

    // 1. Fetch user data from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error(`Profile not found: ${profileError?.message}`)
    }

    // 2. Prepare AI Prompt
    const full_name = profile.full_name || 'Usuario';
    const age = profile.age || 30;
    const gender = profile.gender || 'otro';
    const height_cm = profile.height_value || 170;
    const current_weight_kg = profile.weight_value || 70;
    const target_weight_kg = profile.target_weight_kg || current_weight_kg;
    const goal_type = profile.nutrition_goal || 'mantenimiento';
    const activity_level = profile.activity_level || 'sedentario';
    const diet_type = profile.diet_type || 'balanceada';
    const work_schedule = profile.work_schedule || 'horario regular';
    const hunger_trigger = profile.hunger_trigger || 'hambre fisiológica';
    const weekend_struggle = profile.weekend_struggle || 'vida social';

    const systemPrompt = `Actúa como un Nutricionista Clínico y experto en Psicología Conductual. Tu tarea es procesar los datos de un nuevo usuario para generar un plan de nutrición y hábitos que sea científicamente preciso y psicológicamente motivador. `;
    
    const userPrompt = `
User Inputs (Extraídos de Supabase):
Nombre: ${full_name}
Físico: ${age} años, ${gender}, ${height_cm}cm, ${current_weight_kg}kg.
Objetivo: ${goal_type} para llegar a ${target_weight_kg}kg.
Estilo de Vida: ${activity_level}, dieta ${diet_type}, trabaja en ${work_schedule}.
Barreras Identificadas: Come por ${hunger_trigger}, le cuesta los fines de semana: ${weekend_struggle}.

Requerimientos de Salida (JSON Estricto):
1. Cálculos: TDEE (Mifflin-St Jeor), objetivo calórico diario (ajustado +/- 15% según meta) y macros (P/C/F).
2. Informe de Predicción de Éxito: Basado en su perfil psicológico, calcula un % de probabilidad de éxito y define su barrera principal.
3. Insights Conductuales: 3 consejos prácticos basados específicamente en sus disparadores (triggers) y entorno social.

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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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

    // 3. Save result back to profiles
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        nutritional_plan: aiResponse,
        onboarding_completed: true,
        onboarding_step: 'completed',
        // Update top-level values for quick access
        steps_goal: profile.steps_goal || 10000,
        daily_calorie_target: aiResponse.plan_nutricional.calorias_objetivo
      })
      .eq('id', userId)

    if (updateError) throw updateError

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error generating plan:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
