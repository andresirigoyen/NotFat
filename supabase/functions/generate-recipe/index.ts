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
    const { ingredients: requestedIngredients, userId } = await req.json()
    const supabase = getSupabaseAdmin()

    if (!requestedIngredients) {
      return new Response(JSON.stringify({ error: 'Ingredients are required' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY is not configured')

    const model = 'gemini-1.5-flash'
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const prompt = `Create a healthy recipe using: "${requestedIngredients}"
    
    Respond ONLY with this exact JSON:
    {
      "name": "dish name",
      "description": "brief description",
      "ingredients": "ingredient list string",
      "instructions": "step-by-step instructions string",
      "nutrition": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
      "time": number,
      "difficulty": "Easy" or "Medium"
    }`

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      })
    })

    const body = await aiResponse.json()
    const content = body.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || ''
    const recipeData = JSON.parse(content.replace(/```json|```/g, '').trim())

    // 3. Persist Recipe if userId is provided
    let recipeId = null;
    if (userId) {
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          name: recipeData.name,
          description: recipeData.description,
          ingredients: recipeData.ingredients,
          instructions: recipeData.instructions,
          calories: recipeData.nutrition?.calories,
          protein: recipeData.nutrition?.protein,
          carbs: recipeData.nutrition?.carbs,
          fat: recipeData.nutrition?.fat,
          prep_time: recipeData.time,
          difficulty: recipeData.difficulty?.toLowerCase(),
          created_by: userId,
          is_public: false
        })
        .select()
        .single();
      
      if (recipeError) throw recipeError;
      recipeId = recipe?.id;
    }

    return new Response(JSON.stringify({ 
      recipe: recipeData,
      recipeId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error in generate-recipe:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})
