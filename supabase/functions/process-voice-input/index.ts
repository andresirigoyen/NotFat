import { serve } from 'std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode } from "std/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Función para procesar audio usando Google Gemini (gratis)
async function processAudioWithGemini(audioUrl: string): Promise<any> {
  const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY not configured');
  }

  // Descargar el audio
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Error al descargar el audio: ${audioResponse.status} ${audioResponse.statusText}`);
  }
  const audioBuffer = await audioResponse.arrayBuffer();
  const audioBase64 = encode(new Uint8Array(audioBuffer));

  const prompt = `Eres un experto en nutrición. Este audio describe una comida. 
1. Transcribe lo que el usuario dijo
2. Analiza la comida descrita y extrae en JSON:
{
  "name": "nombre del plato",
  "transcription": "texto transcrito",
  "ingredients": [{"name": "ingrediente", "quantity": 100, "unit": "g"}],
  "calories": 250,
  "protein": 20,
  "carbs": 30,
  "fat": 10,
  "meal_type": "lunch"
}
Responde ÚNICAMENTE con el JSON, sin texto extra.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'audio/m4a', data: audioBase64 } }
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (!result.candidates || result.candidates.length === 0) {
    throw new Error('No se pudo procesar el audio');
  }

  const content = result.candidates[0].content.parts[0].text;
  const cleanContent = content.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleanContent);
  } catch {
    // Intentar extraer JSON del texto
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No se pudo parsear la respuesta');
  }
}

// Función legacy para analizar texto con IA (ya no se usa, mantenida por compatibilidad)
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

serve(async (req: Request) => {
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
      // Usar Gemini para procesar audio (gratis)
      const analysis = await processAudioWithGemini(task.audio_url);

      // 3. Crear comida con los resultados
      if (!task.user_id) {
        throw new Error('Task holds no user_id')
      }

      const mealData = {
        user_id: task.user_id,
        name: analysis.name,
        meal_type: analysis.meal_type || 'snack',
        source_type: 'voice',
        status: 'complete',
        total_calories: analysis.calories,
        total_protein: analysis.protein,
        total_carbs: analysis.carbs,
        total_fat: analysis.fat,
        llm_used: 'gemini-2.5-flash',
        text_description: analysis.transcription,
      }

      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert(mealData)
        .select()
        .single()

      if (mealError) throw mealError

      // 4. Agregar ingredientes si existen
      if (analysis.ingredients && analysis.ingredients.length > 0 && analysis.calories > 0) {
        const foodItems = analysis.ingredients.map((ingredient: any) => ({
          meal_id: meal.id,
          name: ingredient.name,
          quantity: ingredient.quantity || 100,
          unit: ingredient.unit || 'g',
          calories: Math.round((analysis.calories * (ingredient.quantity || 100)) / 100),
          protein: Math.round((analysis.protein * (ingredient.quantity || 100)) / 100),
          carbs: Math.round((analysis.carbs * (ingredient.quantity || 100)) / 100),
          fat: Math.round((analysis.fat * (ingredient.quantity || 100)) / 100),
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
            transcription: analysis.transcription,
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

    } catch (processingError: any) {
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

  } catch (error: any) {
    console.error('Error in process-voice-input function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
