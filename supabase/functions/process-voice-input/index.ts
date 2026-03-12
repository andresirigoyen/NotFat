import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Función para transcribir audio usando OpenAI Whisper
async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'multipart/form-data',
      },
      body: JSON.stringify({
        url: audioUrl,
        model: 'whisper-1',
        language: 'es',
        response_format: 'text',
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    return await response.text()
  } catch (error) {
    console.error('Error transcribing audio:', error)
    throw error
  }
}

// Función para analizar texto con IA
async function analyzeMealText(text: string): Promise<any> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en nutrición. Analiza el siguiente texto que describe una comida y extrae:
            1. Nombre de la comida
            2. Ingredientes con cantidades aproximadas
            3. Calorías estimadas
            4. Macronutrientes (proteína, carbohidratos, grasa) en gramos
            5. Tipo de comida (desayuno, almuerzo, cena, snack)

            Responde en formato JSON:
            {
              "name": "nombre de la comida",
              "ingredients": [
                {"name": "ingrediente", "quantity": 100, "unit": "g"}
              ],
              "calories": 250,
              "protein": 20,
              "carbs": 30,
              "fat": 10,
              "meal_type": "lunch"
            }`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    return JSON.parse(result.choices[0].message.content)
  } catch (error) {
    console.error('Error analyzing meal text:', error)
    throw error
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { taskId } = await req.json()

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'Task ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener información de la tarea
    const { data: task, error: taskError } = await supabase
      .from('task_queue')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Actualizar estado a procesando
    await supabase
      .from('task_queue')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    try {
      // 1. Transcribir audio
      const transcription = await transcribeAudio(task.audio_url)

      // 2. Analizar texto transcribido
      const analysis = await analyzeMealText(transcription)

      // 3. Crear comida con los resultados
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        throw new Error('User not authenticated')
      }

      const mealData = {
        user_id: user.user.id,
        name: analysis.name,
        meal_type: analysis.meal_type,
        source_type: 'voice',
        status: 'complete',
        total_calories: analysis.calories,
        total_protein: analysis.protein,
        total_carbs: analysis.carbs,
        total_fat: analysis.fat,
        llm_used: 'gpt-4.1-mini',
        text_description: transcription,
      }

      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert(mealData)
        .select()
        .single()

      if (mealError) throw mealError

      // 4. Agregar ingredientes si existen
      if (analysis.ingredients && analysis.ingredients.length > 0) {
        const foodItems = analysis.ingredients.map((ingredient: any) => ({
          meal_id: meal.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit || 'g',
          calories: Math.round((analysis.calories * ingredient.quantity) / 100), // Estimación proporcional
          protein: Math.round((analysis.protein * ingredient.quantity) / 100),
          carbs: Math.round((analysis.carbs * ingredient.quantity) / 100),
          fat: Math.round((analysis.fat * ingredient.quantity) / 100),
        }))

        await supabase.from('food_items').insert(foodItems)
      }

      // 5. Actualizar tarea como completada
      await supabase
        .from('task_queue')
        .update({
          status: 'completed',
          processing_completed_at: new Date().toISOString(),
          metadata: {
            transcription,
            analysis,
            meal_id: meal.id,
          },
        })
        .eq('id', taskId)

      return new Response(
        JSON.stringify({
          success: true,
          meal: {
            id: meal.id,
            name: meal.name,
            calories: meal.total_calories,
            protein: meal.total_protein,
            carbs: meal.total_carbs,
            fat: meal.total_fat,
            meal_type: meal.meal_type,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (processingError) {
      console.error('Error processing audio:', processingError)

      // Actualizar tarea como error
      await supabase
        .from('task_queue')
        .update({
          status: 'error',
          error_message: processingError.message,
          last_error_at: new Date().toISOString(),
        })
        .eq('id', taskId)

      throw processingError
    }

  } catch (error) {
    console.error('Error in process-voice-input function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
