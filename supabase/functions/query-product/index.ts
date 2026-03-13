/// <reference path="../deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declare Deno global for TypeScript
declare global {
  namespace Deno {
    namespace env {
      function get(key: string): string | undefined;
    }
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { barcode } = await req.json()

    if (!barcode) {
      return new Response(
        JSON.stringify({ error: 'Barcode is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Primero buscar en nuestra base de datos
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: localProduct, error: localError } = await supabase
      .from('food_items')
      .select('*')
      .eq('barcode_number', barcode)
      .single()

    if (localProduct && !localError) {
      return new Response(
        JSON.stringify({
          found: true,
          source: 'local_db',
          product: {
            name: localProduct.name,
            calories: localProduct.calories,
            protein: localProduct.protein,
            carbs: localProduct.carbs,
            fat: localProduct.fat,
            fiber: localProduct.fiber,
            sugar: localProduct.sugar,
            sodium: localProduct.sodium,
            nutriscore_grade: localProduct.nutriscore_grade,
            nova_group: localProduct.nova_group,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Si no encuentra, buscar en Open Food Facts
    try {
      const openFoodFactsResponse = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
      )

      if (openFoodFactsResponse.ok) {
        const productData = await openFoodFactsResponse.json()

        if (productData.status === 1) {
          const product = productData.product
          
          // Guardar en nuestra base de datos para futuras consultas
          await supabase
            .from('food_items')
            .upsert({
              name: product.product_name || 'Producto Desconocido',
              barcode_number: barcode,
              calories: product.nutriments?.['energy-kcal_100g'] || 0,
              protein: product.nutriments?.proteins_100g || 0,
              carbs: product.nutriments?.carbohydrates_100g || 0,
              fat: product.nutriments?.fat_100g || 0,
              fiber: product.nutriments?.fiber_100g || 0,
              sugar: product.nutriments?.sugars_100g || 0,
              sodium: product.nutriments?.sodium_100g || 0,
              nutriscore_grade: product.nutriscore_grade,
              nova_group: product.nova_group,
              labels_tags: product.labels_tags,
              additives_tags: product.additives_tags,
              scanned: true,
              contributed: false,
            })

          return new Response(
            JSON.stringify({
              found: true,
              source: 'open_food_facts',
              product: {
                name: product.product_name || 'Producto Desconocido',
                calories: Math.round(product.nutriments?.['energy-kcal_100g'] || 0),
                protein: product.nutriments?.proteins_100g || 0,
                carbs: product.nutriments?.carbohydrates_100g || 0,
                fat: product.nutriments?.fat_100g || 0,
                fiber: product.nutriments?.fiber_100g || 0,
                sugar: product.nutriments?.sugars_100g || 0,
                sodium: product.nutriments?.sodium_100g || 0,
                nutriscore_grade: product.nutriscore_grade,
                nova_group: product.nova_group,
                ingredients: product.ingredients_text ? [product.ingredients_text] : [],
                image_url: product.image_url,
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    } catch (openFoodError) {
      console.error('Open Food Facts API error:', openFoodError)
    }

    // 3. Si no encuentra en ninguna fuente
    return new Response(
      JSON.stringify({
        found: false,
        source: 'not_found',
        message: 'Product not found in any database'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in query-product function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
