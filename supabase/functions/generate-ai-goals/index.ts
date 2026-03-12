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
    const { userId, profileData } = await req.json()

    // Validación de entrada
    if (!userId || !profileData) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos: userId y profileData' }), 
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

    // 2. Construir el prompt para generar metas personalizadas
    const prompt = `Como nutricionista experto, genera metas personalizadas basadas en este perfil de usuario:

PERFIL DEL USUARIO:
- Edad: ${profileData.age ? profileData.age + ' años' : 'No especificada'}
- Género: ${profileData.gender || 'No especificado'}
- Altura: ${profileData.height || 'No especificada'} ${profileData.heightUnit || 'cm'}
- Peso: ${profileData.weight || 'No especificado'} ${profileData.weightUnit || 'kg'}
- Nivel de actividad: ${profileData.workoutFrequency || 'No especificado'}
- Objetivo principal: ${profileData.nutritionGoal || 'No especificado'}
- Tipo de dieta: ${profileData.dietType || 'Balanceada'}

INSTRUCCIONES:
1. Calcula el TMB (Tasa Metabólica Basal) y GET (Gasto Energético Total)
2. Genera metas REALISTAS y SALUDABLES
3. Considera el objetivo principal (perder peso, mantener, ganar músculo, mejorar salud)
4. Adapta al nivel de actividad física
5. Respeta las preferencias de dieta

RESPUESTA REQUERIDA (JSON exacto):
{
  "calories": número de calorías diarias recomendadas,
  "protein": gramos de proteína diarios,
  "carbs": gramos de carbohidratos diarios,
  "fat": gramos de grasa diarios,
  "water_ml": mililitros de agua diarios recomendados,
  "steps_daily": número de pasos diarios recomendados,
  "workout_frequency": "sedentary|light|moderate|active|very_active",
  "reasoning": "explicación detallada de por qué estas metas son apropiadas para este perfil específico"
}

IMPORTANTE: Responde SOLO el JSON sin formato de código ni explicaciones adicionales.`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Error en API de Gemini: ${response.status}`)
    }

    const data = await response.json()
    
    // 3. Procesar respuesta de la IA
    let aiResponse
    try {
      const textResponse = data.candidates[0].content.parts[0].text
      // Limpiar el texto para extraer JSON puro
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No se pudo extraer JSON de la respuesta')
      }
    } catch (parseError) {
      console.error('Error parseando respuesta de IA:', parseError)
      // Valores por defecto si falla el parsing
      aiResponse = {
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 67,
        water_ml: 2000,
        steps_daily: 8000,
        workout_frequency: profileData.workoutFrequency || 'moderate',
        reasoning: 'Metas generadas basadas en recomendaciones estándar para un adulto promedio.'
      }
    }

    // 4. Guardar en base de datos (tabla nutrition_goals de Prisma)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: dbError } = await supabase
      .from('nutrition_goals')
      .insert({
        user_id: userId,
        calories: aiResponse.calories,
        protein: aiResponse.protein,
        carbs: aiResponse.carbs,
        fat: aiResponse.fat,
        start_date: new Date().toISOString(),
        source: 'ia' // Sincronizado con Prisma: nutrition_goal_source enum
      })

    if (dbError) {
      console.error('Error guardando metas en BD:', dbError)
      // No fallamos la respuesta al usuario si falla la BD
    }

    // 5. Actualizar perfil del usuario con metas de actividad
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        steps_goal: aiResponse.steps_daily,
        workout_frequency: aiResponse.workout_frequency,
        preferred_bottle_size: Math.round(aiResponse.water_ml / 8), // Aprox 8 vasos de 250ml
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Error actualizando perfil:', profileError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        goals: aiResponse,
        message: 'Metas generadas exitosamente'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error en generate-ai-goals:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
