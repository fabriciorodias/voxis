import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type DB = SupabaseClient<Database>

export type MotivoBloqueio = 'device' | 'cookie' | 'ip_ua'

export type SinaisRateLimit = {
  deviceHash: string
  ipHash: string | null
  userAgentHash: string | null
  /** true se o cliente enviou o cookie HTTP-only de 24h */
  temCookieRecente: boolean
}

/**
 * Bloqueia uma nova avaliação do mesmo cliente para o mesmo GR nas últimas
 * 24h. A checagem roda em 3 camadas (OR lógico — basta uma bater):
 *
 *  1. Cookie HTTP-only `voxis_av_<gr_id>` presente (o mais rápido).
 *  2. Hash do dispositivo (fingerprint client-side) igual ao de uma avaliação
 *     recente.
 *  3. Par (ip_hash, user_agent_hash) igual ao de uma avaliação recente —
 *     cobre o caso de modo anônimo do navegador, onde o fingerprint muda mas
 *     o IP e o user agent permanecem os mesmos.
 *
 * Trade-off conhecido da camada 3: dois clientes distintos atrás de um mesmo
 * NAT usando exatamente o mesmo navegador que tentarem avaliar o MESMO GR
 * dentro da mesma janela de 24h serão bloqueados. É um falso positivo raro e
 * aceitável dado o ganho em robustez contra reavaliação individual.
 */
export async function verificarRateLimit(
  supabase: DB,
  grId: string,
  sinais: SinaisRateLimit
): Promise<{ permitido: boolean; motivo: MotivoBloqueio | null }> {
  if (sinais.temCookieRecente) {
    return { permitido: false, motivo: 'cookie' }
  }

  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count: countDevice } = await supabase
    .from('avaliacao')
    .select('*', { count: 'exact', head: true })
    .eq('gr_id', grId)
    .eq('dispositivo_hash', sinais.deviceHash)
    .gte('respondido_em', desde)

  if ((countDevice ?? 0) > 0) {
    return { permitido: false, motivo: 'device' }
  }

  // Camada 3: IP+UA. Só roda se tivermos os dois hashes — é o que dá
  // especificidade suficiente pra não gerar falsos positivos demais.
  if (sinais.ipHash && sinais.userAgentHash) {
    const { count: countIpUa } = await supabase
      .from('avaliacao')
      .select('*', { count: 'exact', head: true })
      .eq('gr_id', grId)
      .eq('ip_hash', sinais.ipHash)
      .eq('user_agent_hash', sinais.userAgentHash)
      .gte('respondido_em', desde)

    if ((countIpUa ?? 0) > 0) {
      return { permitido: false, motivo: 'ip_ua' }
    }
  }

  return { permitido: true, motivo: null }
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

/**
 * Extrai IP do request honrando cabeçalhos de proxy do Vercel/Cloudflare.
 */
export function extrairIp(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return headers.get('x-real-ip') ?? null
}

/**
 * Calcula os hashes usados pelo rate limit server-side a partir dos headers
 * da requisição.
 */
export async function hashesDaRequisicao(headers: Headers): Promise<{
  ipHash: string | null
  userAgentHash: string | null
}> {
  const ip = extrairIp(headers)
  const ua = headers.get('user-agent')
  return {
    ipHash: ip ? await hashString(ip) : null,
    userAgentHash: ua ? await hashString(ua) : null,
  }
}

/** Nome do cookie usado pro bloqueio por 24h, escopado por GR. */
export function nomeCookieAvaliou(grId: string): string {
  // Aceita apenas hex/uuid: evita qualquer escape esquisito
  const seguro = grId.replace(/[^a-zA-Z0-9_-]/g, '')
  return `voxis_av_${seguro}`
}
