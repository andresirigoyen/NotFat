import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getSupabaseAdmin } from "../_shared/db.ts"

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nutritionData, userId, date } = await req.json()
    const supabase = getSupabaseAdmin()

    if (!nutritionData || !userId || !date) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // 1. Calculate Goals
    const { data: goals } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    const goal = goals?.[0] || { calories: 2000, protein: 70, carbs: 250, fat: 65 };

    // 2. Score Calculation Logic
    let score = 70;
    const analysis: any = {};
    
    const calorieRatio = nutritionData.totalCalories / (goal.calories || 2000);
    if (calorieRatio > 0.8 && calorieRatio < 1.2) score += 10;
    else score -= 10;

    score = Math.max(0, Math.min(100, score));

    // 3. Persist Insights
    const { data: insights, error: insightsError } = await supabase
      .from('coach_insights')
      .insert({
        user_id: userId,
        insights: {
          score,
          nutritionData,
          analysis: "AI analysis logic preserved in results",
        },
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (insightsError) throw insightsError;

    return new Response(JSON.stringify({
      score,
      insightsId: insights?.id,
      ...insights?.insights
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error in calculate-health-score:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})
