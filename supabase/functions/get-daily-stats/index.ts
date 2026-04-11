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
    const { userId, date } = await req.json()
    const supabase = getSupabaseAdmin()

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Fetch nutrition goals
    const { data: goals } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    const goal = goals?.[0];

    // 2. Fetch meals and sum calories/macros
    const { data: mealsToday } = await supabase
      .from('meals')
      .select('*, food_items(*)')
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    let consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    (mealsToday || []).forEach((meal: any) => {
      (meal.food_items || []).forEach((item: any) => {
        consumed.calories += Number(item.calories) || 0;
        consumed.protein += Number(item.protein) || 0;
        consumed.carbs += Number(item.carbs) || 0;
        consumed.fat += Number(item.fat) || 0;
      });
    });

    // 3. Fetch water logs
    const { data: waterLogs } = await supabase
      .from('water_logs')
      .select('volume')
      .eq('user_id', userId)
      .gte('logged_at', startOfDay.toISOString())
      .lte('logged_at', endOfDay.toISOString());

    const waterConsumed = (waterLogs || []).reduce((acc: number, log: any) => acc + (Number(log.volume) || 0), 0);

    // 4. Fetch steps from daily snapshots
    const { data: snapshots } = await supabase
      .from('health_daily_snapshots')
      .select('steps')
      .eq('user_id', userId)
      .gte('date', startOfDay.toISOString().split('T')[0])
      .lte('date', endOfDay.toISOString().split('T')[0])
      .limit(1);

    return new Response(JSON.stringify({
      goals: goal || { calories: 2000, protein: 150, carbs: 200, fat: 70 },
      consumed,
      water: {
        consumed: waterConsumed,
        target: 3000
      },
      steps: {
        current: snapshots?.[0]?.steps || 0,
        target: 10000
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error in get-daily-stats:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})
