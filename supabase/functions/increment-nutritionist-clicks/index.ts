import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nutritionist_id, click_type } = await req.json()

    if (!nutritionist_id || !click_type) {
      return new Response(
        JSON.stringify({ error: 'Missing nutritionist_id or click_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate click_type
    if (!['instagram', 'whatsapp'].includes(click_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid click_type. Must be instagram or whatsapp' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseClient = (url: string, key: string) => {
      return new SupabaseClient(url, key)
    }

    // Increment the appropriate click counter
    const field = click_type === 'instagram' ? 'clicks_ig' : 'clicks_wtp'
    
    const { data, error } = await supabaseClient(supabaseUrl, supabaseServiceKey)
      .from('nutritionists')
      .update({
        [field]: supabaseClient.sql`${field} + 1`
      })
      .eq('id', nutritionist_id)
      .select('clicks_ig, clicks_wtp')
      .single()

    if (error) {
      console.error('Error incrementing clicks:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to increment clicks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          clicks_ig: data.clicks_ig,
          clicks_wtp: data.clicks_wtp
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in increment-nutritionist-clicks function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper SupabaseClient class
class SupabaseClient {
  private url: string
  private key: string

  constructor(url: string, key: string) {
    this.url = url
    this.key = key
  }

  from(table: string) {
    return new SupabaseQueryBuilder(this.url, this.key, table)
  }
}

class SupabaseQueryBuilder {
  private url: string
  private key: string
  private table: string
  private query: any = {}

  constructor(url: string, key: string, table: string) {
    this.url = url
    this.key = key
    this.table = table
  }

  update(data: any) {
    this.query.data = data
    return this
  }

  eq(column: string, value: any) {
    this.query.eq = { [column]: value }
    return this
  }

  select(columns: string) {
    this.query.select = columns
    return this
  }

  single() {
    return this
  }

  async then(resolve: any, reject?: any) {
    try {
      const response = await fetch(`${this.url}/rest/v1/${this.table}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...this.query.data,
          ...this.query.eq
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Query failed')
      }

      const data = await response.json()
      resolve({ data, error: null })
    } catch (error) {
      reject({ data: null, error })
    }
  }

  sql(expression: string) {
    return { raw: expression }
  }
}
