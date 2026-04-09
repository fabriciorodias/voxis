import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type DB = SupabaseClient<Database>

// Bloqueia: mesmo device + mesmo GR nas últimas 24h
export async function verificarRateLimit(
  supabase: DB,
  grId: string,
  deviceHash: string
): Promise<{ permitido: boolean }> {
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('avaliacao')
    .select('*', { count: 'exact', head: true })
    .eq('gr_id', grId)
    .eq('dispositivo_hash', deviceHash)
    .gte('respondido_em', desde)

  return { permitido: (count ?? 0) === 0 }
}

// Detecta rajada: 5+ respostas ao mesmo GR nos últimos 10 min
export async function detectarRajada(
  supabase: DB,
  grId: string
): Promise<boolean> {
  const desde = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('avaliacao')
    .select('*', { count: 'exact', head: true })
    .eq('gr_id', grId)
    .gte('respondido_em', desde)

  return (count ?? 0) >= 5
}

// Hash SHA-256 (para IP e user agent)
export async function hashString(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
