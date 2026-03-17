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
    const { imageUrl, userId } = await req.json()

    // 1. Input validation
    if (!imageUrl || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: imageUrl and userId' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 2. AI API Configuration
    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured')
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const prompt = `Analyze this food image and return a JSON with:
    - name: name of the dish
    - calories: estimated total
    - macros: { protein, carbs, fat } in grams
    - ingredients: Array of { name, calories, protein, carbs, fat }
    - health_score: 1-10
    IMPORTANT: Respond ONLY with the JSON.`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { 
              inline_data: {
                mime_type: "image/jpeg",
                data: await fetch(imageUrl).then(r => r.arrayBuffer()).then(buf => 
                  btoa(String.fromCharCode(...new Uint8Array(buf)))
                )
              }
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`)
    }

    const result = await response.json()
    const content = result.candidates[0].content.parts[0].text
    const analysis = JSON.parse(content.replace(/```json|```/g, '').trim())

    // 3. Database Persistence using Prisma
    const prisma = getPrismaClient();

    // Verify user exists
    const user = await prisma.profiles.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User profile not found. Please complete onboarding first.');
    }

    // Create the meal record
    const meal = await prisma.meals.create({
      data: {
        user_id: userId,
        name: analysis.name,
        image_url: imageUrl,
        status: 'complete',
        source_type: 'camera',
        llm_used: 'gemini_2_5_flash',
        food_items: {
          create: (analysis.ingredients || []).map((ing: any) => ({
            name: ing.name,
            calories: ing.calories || 0,
            protein: ing.protein || 0,
            carbs: ing.carbs || 0,
            fat: ing.fat || 0,
          }))
        }
      },
      include: {
        food_items: true
      }
    });

    return new Response(JSON.stringify({ 
      ...analysis,
      mealId: meal.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error in analyze-meal:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
