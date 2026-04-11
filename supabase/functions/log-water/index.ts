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
    const { userId, volume, unit, timezone } = await req.json()
    const supabase = getSupabaseAdmin()

    if (!userId || !volume) {
      return new Response(JSON.stringify({ error: 'userId and volume are required' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // 1. Create water log
    const { data: waterLog, error: insertError } = await supabase
      .from('water_logs')
      .insert({
        user_id: userId,
        volume: parseFloat(volume),
        unit: unit || 'ml',
        logged_at: new Date().toISOString(),
        recorded_timezone: timezone || 'UTC'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 2. Aggregate today's water to calculate progress
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();

    const { data: todayLogs } = await supabase
      .from('water_logs')
      .select('volume')
      .eq('user_id', userId)
      .gte('logged_at', startOfDay)
      .lte('logged_at', endOfDay);

    const totalToday = (todayLogs || []).reduce((acc: number, log: any) => acc + (log.volume || 0), 0);

    return new Response(JSON.stringify({
      success: true,
      logId: waterLog?.id,
      totalToday
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error in log-water:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})
