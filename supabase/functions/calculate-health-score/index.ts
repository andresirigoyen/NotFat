import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NutritionData {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  mealCount: number;
}

interface UserProfile {
  height_value?: number;
  weight_value?: number;
  birth_date?: string;
  gender?: string;
  activity_level?: number;
  nutrition_goals?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

// Función para calcular edad
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Función para calcular TMB usando Mifflin-St Jeor
function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

// Función para calcular requerimientos calóricos diarios
function calculateDailyCalories(bmr: number, activityLevel: number): number {
  return bmr * activityLevel;
}

// Función para generar insights con IA
async function generateAIInsights(
  nutritionData: NutritionData,
  userProfile: UserProfile,
  healthScore: number
): Promise<any> {
  try {
    const prompt = `Como nutricionista experto, analiza estos datos nutricionales y genera insights personalizados:

Datos del día:
- Calorías: ${nutritionData.totalCalories}
- Proteína: ${nutritionData.totalProtein}g
- Carbohidratos: ${nutritionData.totalCarbs}g
- Grasa: ${nutritionData.totalFat}g
- Fibra: ${nutritionData.totalFiber}g
- Azúcar: ${nutritionData.totalSugar}g
- Sodio: ${nutritionData.totalSodium}mg
- Número de comidas: ${nutritionData.mealCount}

Perfil del usuario:
- Edad: ${userProfile.birth_date ? calculateAge(userProfile.birth_date) : 'N/A'}
- Género: ${userProfile.gender || 'N/A'}
- Peso: ${userProfile.weight_value || 'N/A'}kg
- Altura: ${userProfile.height_value || 'N/A'}cm
- Nivel de actividad: ${userProfile.activity_level || 'N/A'}

Health Score actual: ${healthScore}/100

Genera un análisis en formato JSON con:
1. insights: Array de strings con observaciones generales
2. recommendations: Array de strings con recomendaciones accionables
3. strengths: Array de strings con aspectos positivos
4. weaknesses: Array de strings con áreas a mejorar

Sé específico, personalizado y motivador. Máximo 3-4 items por categoría.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un nutricionista experto que proporciona consejos prácticos y personalizados.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    return JSON.parse(result.choices[0].message.content)
  } catch (error) {
    console.error('Error generating AI insights:', error)
    // Fallback a insights genéricos
    return {
      insights: [
        `Consumiste ${nutritionData.totalCalories} calorías hoy`,
        `Hiciste ${nutritionData.mealCount} comidas durante el día`
      ],
      recommendations: [
        'Mantén un balance adecuado de macronutrientes',
        'Aumenta el consumo de vegetales y frutas'
      ],
      strengths: [],
      weaknesses: []
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nutritionData, userId, date } = await req.json()

    if (!nutritionData || !userId || !date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calcular requerimientos diarios
    let dailyCaloriesGoal = 2000 // Default
    let proteinGoal = 50 // Default
    let carbsGoal = 250 // Default
    let fatGoal = 65 // Default

    if (profile.weight_value && profile.height_value && profile.birth_date) {
      const age = calculateAge(profile.birth_date)
      const bmr = calculateBMR(
        profile.weight_value,
        profile.height_value,
        age,
        profile.gender || 'other'
      )
      dailyCaloriesGoal = calculateDailyCalories(bmr, profile.activity_level || 1.5)
      
      // Calcular macros basados en calorías (15-35% proteína, 45-65% carbs, 20-35% grasa)
      proteinGoal = Math.round((dailyCaloriesGoal * 0.25) / 4) // 25% de calorías
      carbsGoal = Math.round((dailyCaloriesGoal * 0.55) / 4) // 55% de calorías
      fatGoal = Math.round((dailyCaloriesGoal * 0.20) / 9) // 20% de calorías
    }

    // Calcular health score detallado
    let score = 50 // Base score
    const analysis = {
      calories: { score: 0, status: '', message: '' },
      protein: { score: 0, status: '', message: '' },
      carbs: { score: 0, status: '', message: '' },
      fat: { score: 0, status: '', message: '' },
      fiber: { score: 0, status: '', message: '' },
      sugar: { score: 0, status: '', message: '' },
      sodium: { score: 0, status: '', message: '' },
      balance: { score: 0, status: '', message: '' },
      meals: { score: 0, status: '', message: '' },
    }

    // Calorías
    const calorieRatio = nutritionData.totalCalories / dailyCaloriesGoal
    if (calorieRatio >= 0.9 && calorieRatio <= 1.1) {
      analysis.calories.score = 15
      analysis.calories.status = 'excellent'
      analysis.calories.message = 'Calorías perfectamente ajustadas'
    } else if (calorieRatio >= 0.8 && calorieRatio <= 1.2) {
      analysis.calories.score = 10
      analysis.calories.status = 'good'
      analysis.calories.message = 'Calorías dentro de rango aceptable'
    } else if (calorieRatio > 1.2) {
      analysis.calories.score = -10
      analysis.calories.status = 'poor'
      analysis.calories.message = 'Exceso de calorías'
    } else {
      analysis.calories.score = -5
      analysis.calories.status = 'fair'
      analysis.calories.message = 'Calorías insuficientes'
    }

    // Proteína
    const proteinRatio = nutritionData.totalProtein / proteinGoal
    if (proteinRatio >= 0.9 && proteinRatio <= 1.2) {
      analysis.protein.score = 15
      analysis.protein.status = 'excellent'
      analysis.protein.message = 'Proteína adecuada'
    } else if (proteinRatio >= 0.7) {
      analysis.protein.score = 5
      analysis.protein.status = 'good'
      analysis.protein.message = 'Proteína aceptable'
    } else {
      analysis.protein.score = -10
      analysis.protein.status = 'poor'
      analysis.protein.message = 'Proteína insuficiente'
    }

    // Fibra
    if (nutritionData.totalFiber >= 25) {
      analysis.fiber.score = 10
      analysis.fiber.status = 'excellent'
      analysis.fiber.message = 'Excelente consumo de fibra'
    } else if (nutritionData.totalFiber >= 20) {
      analysis.fiber.score = 5
      analysis.fiber.status = 'good'
      analysis.fiber.message = 'Buen consumo de fibra'
    } else {
      analysis.fiber.score = -10
      analysis.fiber.status = 'poor'
      analysis.fiber.message = 'Fibra insuficiente'
    }

    // Azúcar
    if (nutritionData.totalSugar <= 25) {
      analysis.sugar.score = 10
      analysis.sugar.status = 'excellent'
      analysis.sugar.message = 'Excelente control de azúcar'
    } else if (nutritionData.totalSugar <= 50) {
      analysis.sugar.score = 5
      analysis.sugar.status = 'good'
      analysis.sugar.message = 'Control de azúcar aceptable'
    } else {
      analysis.sugar.score = -10
      analysis.sugar.status = 'poor'
      analysis.sugar.message = 'Exceso de azúcar'
    }

    // Balance de macros
    const proteinRatioPercent = (nutritionData.totalProtein * 4) / nutritionData.totalCalories * 100
    const carbRatioPercent = (nutritionData.totalCarbs * 4) / nutritionData.totalCalories * 100
    const fatRatioPercent = (nutritionData.totalFat * 9) / nutritionData.totalCalories * 100

    if (proteinRatioPercent >= 15 && proteinRatioPercent <= 35 &&
        carbRatioPercent >= 45 && carbRatioPercent <= 65 &&
        fatRatioPercent >= 20 && fatRatioPercent <= 35) {
      analysis.balance.score = 15
      analysis.balance.status = 'excellent'
      analysis.balance.message = 'Balance perfecto de macronutrientes'
    } else {
      analysis.balance.score = -5
      analysis.balance.status = 'fair'
      analysis.balance.message = 'Balance de macros mejorable'
    }

    // Número de comidas
    if (nutritionData.mealCount >= 3 && nutritionData.mealCount <= 5) {
      analysis.meals.score = 10
      analysis.meals.status = 'excellent'
      analysis.meals.message = 'Número ideal de comidas'
    } else if (nutritionData.mealCount >= 2) {
      analysis.meals.score = 5
      analysis.meals.status = 'good'
      analysis.meals.message = 'Número aceptable de comidas'
    } else {
      analysis.meals.score = -5
      analysis.meals.status = 'poor'
      analysis.meals.message = 'Pocas comidas durante el día'
    }

    // Calcular score total
    Object.values(analysis).forEach(item => {
      score += item.score
    })

    score = Math.max(0, Math.min(100, score))

    // Determinar calificación
    let grade: 'A' | 'B' | 'C' | 'D' | 'F'
    if (score >= 90) grade = 'A'
    else if (score >= 80) grade = 'B'
    else if (score >= 70) grade = 'C'
    else if (score >= 60) grade = 'D'
    else grade = 'F'

    // Generar insights con IA
    const aiInsights = await generateAIInsights(nutritionData, profile, score)

    // Guardar en coach_insights
    const insightsData = {
      user_id: userId,
      insights: {
        score,
        grade,
        analysis,
        goals: {
          calories: dailyCaloriesGoal,
          protein: proteinGoal,
          carbs: carbsGoal,
          fat: fatGoal,
        },
        ...aiInsights,
      },
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 horas
    }

    const { data: savedInsights, error: saveError } = await supabase
      .from('coach_insights')
      .insert(insightsData)
      .select()
      .single()

    if (saveError) {
      console.error('Error saving insights:', saveError)
    }

    return new Response(
      JSON.stringify({
        score,
        grade,
        analysis,
        goals: {
          calories: dailyCaloriesGoal,
          protein: proteinGoal,
          carbs: carbsGoal,
          fat: fatGoal,
        },
        ...aiInsights,
        generated_at: insightsData.generated_at,
        expires_at: insightsData.expires_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in calculate-health-score function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
