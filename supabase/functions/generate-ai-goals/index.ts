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
    const { userId, profileData } = await req.json()
    const prisma = getPrismaClient();

    if (!userId || !profileData) {
      return new Response(JSON.stringify({ error: 'userId and profileData are required' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY is not configured')

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const prompt = `As an expert nutritionist, calculate personalized goals for this profile:
    - Age: ${profileData.age || 'Unknown'}
    - Gender: ${profileData.gender || 'Unknown'}
    - Height: ${profileData.height || 'Unknown'} ${profileData.heightUnit || 'cm'}
    - Weight: ${profileData.weight || 'Unknown'} ${profileData.weightUnit || 'kg'}
    - Activity: ${profileData.workoutFrequency || 'Unknown'}
    - Goal: ${profileData.nutritionGoal || 'Unknown'}
    
    Respond ONLY with this exact JSON:
    {
      "calories": number,
      "protein": grams,
      "carbs": grams,
      "fat": grams,
      "water_ml": number,
      "steps_daily": number,
      "workout_frequency": "sedentary|light|moderate|active|very_active",
      "reasoning": "brief explanation"
    }`

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })

    const data = await aiResponse.json()
    const text = data.candidates[0].content.parts[0].text
    const goals = JSON.parse(text.replace(/```json|```/g, '').trim())

    // 3. Persist Goals using Prisma
    await prisma.$transaction([
      prisma.nutrition_goals.create({
        data: {
          user_id: userId,
          calories: goals.calories,
          protein: goals.protein,
          carbs: goals.carbs,
          fat: goals.fat,
          source: 'ia'
        }
      }),
      prisma.profiles.update({
        where: { id: userId },
        data: {
          steps_goal: goals.steps_daily,
          workout_frequency: goals.workout_frequency,
          preferred_bottle_size: Math.round(goals.water_ml / 8)
        }
      })
    ]);

    return new Response(JSON.stringify({ success: true, goals }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error in generate-ai-goals:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})
