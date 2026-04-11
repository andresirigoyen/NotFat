import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

let supabaseAdmin: any;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
    }

    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  }
  return supabaseAdmin;
}

// Alias for backwards compatibility
export const getPrismaClient = getSupabaseAdmin;
