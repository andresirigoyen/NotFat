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
    const { userId, volume, unit, timezone } = await req.json()
    const prisma = getPrismaClient();

    if (!userId || !volume) {
      return new Response(JSON.stringify({ error: 'userId and volume are required' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // 1. Create water log
    const waterLog = await prisma.water_logs.create({
      data: {
        user_id: userId,
        volume: parseFloat(volume),
        unit: unit || 'ml',
        logged_at: new Date(),
        recorded_timezone: timezone || 'UTC'
      }
    });

    // 2. Aggregate today's water to calculate progress
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    const todayLogs = await prisma.water_logs.findMany({
      where: {
        user_id: userId,
        logged_at: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const totalToday = todayLogs.reduce((acc: number, log: any) => acc + (log.volume || 0), 0);

    return new Response(JSON.stringify({
      success: true,
      logId: waterLog.id,
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
