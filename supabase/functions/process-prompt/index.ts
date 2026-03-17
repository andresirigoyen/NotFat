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
    const { message, userId, userProfile: providedProfile } = await req.json()
    const prisma = getPrismaClient();

    if (!message || !userId) {
      return new Response(JSON.stringify({ error: 'Message and userId are required' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // 1. Fetch user profile and context if not provided
    const userProfile = providedProfile || await prisma.profiles.findUnique({
      where: { id: userId }
    });

    // 1b. Fetch nutrition context about scanned/processed foods using raw SQL on views
    let processedContextStr = "";
    try {
      // Últimos 7 días de ratio de calorías escaneadas
      const weeklyRows = await prisma.$queryRawUnsafe<any[]>(`
        SELECT day, total_calories, scanned_calories, scanned_calories_ratio
        FROM daily_calories_with_scanned_ratio
        WHERE user_id = $1
          AND day >= (CURRENT_DATE - INTERVAL '7 days')
        ORDER BY day DESC
        LIMIT 7;
      `, userId);

      // Top productos escaneados globales para el usuario (basado en food_items)
      const topProducts = await prisma.$queryRawUnsafe<any[]>(`
        SELECT fi.name, SUM(fi.calories) AS total_calories_from_scans, COUNT(*) AS times_scanned
        FROM food_items fi
        JOIN meals m ON fi.meal_id = m.id
        WHERE m.user_id = $1
          AND fi.scanned = TRUE
        GROUP BY fi.name
        HAVING COUNT(*) >= 2
        ORDER BY SUM(fi.calories) DESC
        LIMIT 3;
      `, userId);

      if (weeklyRows && weeklyRows.length > 0) {
        const lastDay = weeklyRows[0];
        const avgRatio =
          weeklyRows.reduce((acc, r) => acc + Number(r.scanned_calories_ratio || 0), 0) /
          weeklyRows.length;

        processedContextStr += `\n\nScan Analytics (últimos 7 días):\n- Promedio de calorías desde alimentos escaneados: ${(avgRatio * 100).toFixed(1)}%\n`;
        processedContextStr += `- Día más reciente: ${(Number(lastDay.scanned_calories_ratio || 0) * 100).toFixed(1)}% de las calorías vinieron de alimentos escaneados.\n`;
      }

      if (topProducts && topProducts.length > 0) {
        const productsStr = topProducts
          .map((p) => `${p.name || 'Producto sin nombre'} (${Number(p.total_calories_from_scans || 0).toFixed(0)} kcal totales, ${Number(p.times_scanned || 0)} escaneos)`)
          .join("; ");
        processedContextStr += `- Productos escaneados que más calorías aportan: ${productsStr}\n`;
      }
    } catch (err) {
      console.error("Error fetching processed food analytics:", err);
    }

    // 2. Log user message
    await prisma.coach_messages.create({
      data: {
        user_id: userId,
        role: 'user',
        content: message
      }
    });

    // 3. Prepare AI Prompt
    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY is not configured')

    const model = Deno.env.get('DEFAULT_LLM_MODEL') || 'gemini-2.5-flash'
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    let userContextStr = ""
    if (userProfile) {
      const parts = []
      if (userProfile.first_name) parts.push(`Name: ${userProfile.first_name}`)
      if (userProfile.diet_type) parts.push(`Diet: ${userProfile.diet_type}`)
      if (userProfile.nutrition_goal) parts.push(`Goal: ${userProfile.nutrition_goal}`)
      userContextStr = "\n\nUser Context:\n- " + parts.join("\n- ")
    }

    const prompt = `You are NotFat AI, an expert nutritional coach.${userContextStr}${processedContextStr}
    
    User Message: "${message}"
    
    Respond ONLY with this exact JSON:
    {
      "type": "chat" or "recipe",
      "response": "your natural response",
      "recipeData": {
        "name": "dish name",
        "ingredients": ["ing 1", "ing 2"],
        "instructions": ["step 1", "step 2"],
        "nutrition": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
      }
    }
    If it's just chat, recipeData should be null.`

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })

    const body = await aiResponse.json()
    const responseText = body.candidates[0].content.parts[0].text
    
    let parsed;
    try {
      parsed = JSON.parse(responseText.replace(/```json|```/g, '').trim())
    } catch (e) {
      parsed = { type: 'chat', response: responseText.trim(), recipeData: null }
    }

    // 4. Log AI response
    await prisma.coach_messages.create({
      data: {
        user_id: userId,
        role: 'assistant',
        content: parsed.response,
        metadata: parsed.recipeData ? { recipe: parsed.recipeData } : undefined
      }
    });

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error in process-prompt:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})
