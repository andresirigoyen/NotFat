import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, date } = await req.json()

    // Query meals with food items
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*, food_items(*)')
      .eq('user_id', user_id)
      .eq('meal_at', date) // Assume date format matches DB

    // Query water logs
    const { data: water, error: waterError } = await supabase
      .from('water_logs')
      .select('volume')
      .eq('user_id', user_id)
      .eq('logged_at', date)

    // Perform Aggregation on Edge
    const statistics = {
      total_kcal: meals?.reduce((acc, m) => acc + (m.food_items?.reduce((sm, i) => sm + (i.calories || 0), 0) || 0), 0),
      water_total: water?.reduce((acc, w) => acc + w.volume, 0),
      meals_count: meals?.length,
      macros: {
        protein: meals?.reduce((acc, m) => acc + (m.food_items?.reduce((sm, i) => sm + (i.protein || 0), 0) || 0), 0),
        carbs: meals?.reduce((acc, m) => acc + (m.food_items?.reduce((sm, i) => sm + (i.carbs || 0), 0) || 0), 0),
        fat: meals?.reduce((acc, m) => acc + (m.food_items?.reduce((sm, i) => sm + (i.fat || 0), 0) || 0), 0),
      }
    }

    return new Response(JSON.stringify(statistics), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
