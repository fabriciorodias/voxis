import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Cliente Supabase com service role key — bypassa RLS e permite operações
 * de auth admin (criar usuário, resetar senha, etc).
 *
 * NUNCA usar em Client Components. Este cliente só deve ser instanciado
 * dentro de Server Actions ou Route Handlers.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos'
    )
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
