import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getPrismaClient } from "../_shared/db.ts"

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
    const prisma = getPrismaClient();

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
    const goal = await prisma.nutrition_goals.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    // 2. Fetch meals and sum calories/macros
    const mealsToday = await prisma.meals.findMany({
      where: {
        user_id: userId,
        meal_at: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        food_items: true
      }
    });

    let consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    mealsToday.forEach(meal => {
      meal.food_items.forEach(item => {
        consumed.calories += item.calories || 0;
        consumed.protein += item.protein || 0;
        consumed.carbs += item.carbs || 0;
        consumed.fat += item.fat || 0;
      });
    });

    // 3. Fetch water logs
    const waterLogs = await prisma.water_logs.findMany({
      where: {
        user_id: userId,
        logged_at: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const waterConsumed = waterLogs.reduce((acc, log) => acc + (log.volume || 0), 0);

    // 4. Fetch steps from daily snapshots
    const snapshot = await prisma.health_daily_snapshots.findFirst({
      where: {
        user_id: userId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    return new Response(JSON.stringify({
      goals: goal || { calories: 2000, protein: 150, carbs: 200, fat: 70 },
      consumed,
      water: {
        consumed: waterConsumed,
        target: 3000 // Default or fetch from hydration_goals
      },
      steps: {
        current: snapshot?.steps || 0,
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
