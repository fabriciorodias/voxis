import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { calcularNPS, type ResultadoNPS } from './nps'

type DB = SupabaseClient<Database>

export type Periodo = '7d' | '30d' | '90d' | '12m'

/**
 * Retorna a chave `yyyy-Www` da semana ISO 8601 que contém a data.
 * ISO: semana começa na segunda-feira; semana 1 é a que contém a primeira
 * quinta-feira do ano (equivalente: contém 4 de janeiro).
 */
function chaveSemanaISO(d: Date): string {
  const target = new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  )
  // Ajustar para quinta-feira da mesma semana ISO
  const diaSemana = (target.getUTCDay() + 6) % 7 // 0=segunda ... 6=domingo
  target.setUTCDate(target.getUTCDate() - diaSemana + 3)
  const anoISO = target.getUTCFullYear()
  const primeiraQuinta = new Date(Date.UTC(anoISO, 0, 4))
  const diffMs = target.getTime() - primeiraQuinta.getTime()
  const semana = 1 + Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))
  return `${anoISO}-W${String(semana).padStart(2, '0')}`
}

export function intervaloDoPeriodo(p: Periodo): {
  desde: string
  ateAnterior: string
  desdeAnterior: string
} {
  const dias = p === '7d' ? 7 : p === '30d' ? 30 : p === '90d' ? 90 : 365
  const agora = Date.now()
  const MS = 24 * 60 * 60 * 1000
  const desde = new Date(agora - dias * MS).toISOString()
  const ateAnterior = desde
  const desdeAnterior = new Date(agora - 2 * dias * MS).toISOString()
  return { desde, ateAnterior, desdeAnterior }
}

// ---------- NPS por agência / banco ----------

export async function getNPSPorAgencia(
  supabase: DB,
  agenciaId: string,
  periodo: Periodo
): Promise<ResultadoNPS & { delta: number | null }> {
  const { desde, ateAnterior, desdeAnterior } = intervaloDoPeriodo(periodo)

  const { data: atuais } = await supabase
    .from('avaliacao')
    .select('nota')
    .eq('agencia_id', agenciaId)
    .eq('status', 'VALIDA')
    .gte('respondido_em', desde)

  const { data: anteriores } = await supabase
    .from('avaliacao')
    .select('nota')
    .eq('agencia_id', agenciaId)
    .eq('status', 'VALIDA')
    .gte('respondido_em', desdeAnterior)
    .lt('respondido_em', ateAnterior)

  const npsAtual = calcularNPS((atuais ?? []).map((x) => x.nota))
  const npsAnterior = calcularNPS((anteriores ?? []).map((x) => x.nota))
  const delta =
    npsAtual.nps !== null && npsAnterior.nps !== null
      ? npsAtual.nps - npsAnterior.nps
      : null

  return { ...npsAtual, delta }
}

export async function getNPSPorBanco(
  supabase: DB,
  bancoId: string,
  periodo: Periodo
): Promise<ResultadoNPS & { delta: number | null }> {
  const { desde, ateAnterior, desdeAnterior } = intervaloDoPeriodo(periodo)

  const { data: atuais } = await supabase
    .from('avaliacao')
    .select('nota')
    .eq('banco_id', bancoId)
    .eq('status', 'VALIDA')
    .gte('respondido_em', desde)

  const { data: anteriores } = await supabase
    .from('avaliacao')
    .select('nota')
    .eq('banco_id', bancoId)
    .eq('status', 'VALIDA')
    .gte('respondido_em', desdeAnterior)
    .lt('respondido_em', ateAnterior)

  const npsAtual = calcularNPS((atuais ?? []).map((x) => x.nota))
  const npsAnterior = calcularNPS((anteriores ?? []).map((x) => x.nota))
  const delta =
    npsAtual.nps !== null && npsAnterior.nps !== null
      ? npsAtual.nps - npsAnterior.nps
      : null

  return { ...npsAtual, delta }
}

// ---------- Ranking de GRs numa agência ----------

export type LinhaRankingGR = {
  gr_id: string
  nome: string
  matricula: string | null
  nps: number | null
  total: number
  delta: number | null
  temAnomalia: boolean
}

export async function getRankingGRs(
  supabase: DB,
  agenciaId: string,
  periodo: Periodo
): Promise<LinhaRankingGR[]> {
  const { desde, ateAnterior, desdeAnterior } = intervaloDoPeriodo(periodo)

  const { data: grs } = await supabase
    .from('gerente_relacionamento')
    .select('id, nome, matricula')
    .eq('agencia_id', agenciaId)
    .eq('ativo', true)
    .order('nome')

  if (!grs || grs.length === 0) return []

  const ids = grs.map((g) => g.id)

  const [{ data: atuais }, { data: anteriores }, { data: anomalias }] =
    await Promise.all([
      supabase
        .from('avaliacao')
        .select('gr_id, nota')
        .in('gr_id', ids)
        .eq('status', 'VALIDA')
        .gte('respondido_em', desde),
      supabase
        .from('avaliacao')
        .select('gr_id, nota')
        .in('gr_id', ids)
        .eq('status', 'VALIDA')
        .gte('respondido_em', desdeAnterior)
        .lt('respondido_em', ateAnterior),
      supabase
        .from('anomalia_log')
        .select('gr_id')
        .in('gr_id', ids)
        .eq('resolvido', false),
    ])

  const notasAtuaisPorGr = new Map<string, number[]>()
  for (const r of atuais ?? []) {
    if (!notasAtuaisPorGr.has(r.gr_id)) notasAtuaisPorGr.set(r.gr_id, [])
    notasAtuaisPorGr.get(r.gr_id)!.push(r.nota)
  }
  const notasAnterioresPorGr = new Map<string, number[]>()
  for (const r of anteriores ?? []) {
    if (!notasAnterioresPorGr.has(r.gr_id)) notasAnterioresPorGr.set(r.gr_id, [])
    notasAnterioresPorGr.get(r.gr_id)!.push(r.nota)
  }
  const anomaliasPorGr = new Set(
    (anomalias ?? []).map((a) => a.gr_id).filter((x): x is string => !!x)
  )

  return grs
    .map((g): LinhaRankingGR => {
      const npsAtual = calcularNPS(notasAtuaisPorGr.get(g.id) ?? [])
      const npsAnt = calcularNPS(notasAnterioresPorGr.get(g.id) ?? [])
      const delta =
        npsAtual.nps !== null && npsAnt.nps !== null
          ? npsAtual.nps - npsAnt.nps
          : null
      return {
        gr_id: g.id,
        nome: g.nome,
        matricula: g.matricula,
        nps: npsAtual.nps,
        total: npsAtual.total,
        delta,
        temAnomalia: anomaliasPorGr.has(g.id),
      }
    })
    .sort((a, b) => {
      // Ordem: NPS não-null desc, depois null por último
      if (a.nps === null && b.nps === null) return 0
      if (a.nps === null) return 1
      if (b.nps === null) return -1
      return b.nps - a.nps
    })
}

// ---------- Ranking de agências ----------

export type LinhaRankingAgencia = {
  agencia_id: string
  nome: string
  codigo: string
  superintendencia_nome: string | null
  nps: number | null
  total: number
  delta: number | null
  temAnomalia: boolean
}

export async function getRankingAgencias(
  supabase: DB,
  bancoId: string,
  periodo: Periodo
): Promise<LinhaRankingAgencia[]> {
  const { desde, ateAnterior, desdeAnterior } = intervaloDoPeriodo(periodo)

  const { data: agencias } = await supabase
    .from('agencia')
    .select('id, nome, codigo, superintendencia_id')
    .eq('banco_id', bancoId)
    .eq('ativo', true)
    .order('codigo')

  if (!agencias || agencias.length === 0) return []

  const ids = agencias.map((a) => a.id)

  const { data: sups } = await supabase
    .from('superintendencia')
    .select('id, nome')
    .eq('banco_id', bancoId)

  const mapaSup = new Map((sups ?? []).map((s) => [s.id, s.nome]))

  const [{ data: atuais }, { data: anteriores }, { data: anomalias }] =
    await Promise.all([
      supabase
        .from('avaliacao')
        .select('agencia_id, nota')
        .in('agencia_id', ids)
        .eq('status', 'VALIDA')
        .gte('respondido_em', desde),
      supabase
        .from('avaliacao')
        .select('agencia_id, nota')
        .in('agencia_id', ids)
        .eq('status', 'VALIDA')
        .gte('respondido_em', desdeAnterior)
        .lt('respondido_em', ateAnterior),
      supabase
        .from('anomalia_log')
        .select('agencia_id')
        .in('agencia_id', ids)
        .eq('resolvido', false),
    ])

  const atuaisPorAg = new Map<string, number[]>()
  for (const r of atuais ?? []) {
    if (!atuaisPorAg.has(r.agencia_id)) atuaisPorAg.set(r.agencia_id, [])
    atuaisPorAg.get(r.agencia_id)!.push(r.nota)
  }
  const anterioresPorAg = new Map<string, number[]>()
  for (const r of anteriores ?? []) {
    if (!anterioresPorAg.has(r.agencia_id)) anterioresPorAg.set(r.agencia_id, [])
    anterioresPorAg.get(r.agencia_id)!.push(r.nota)
  }
  const anomaliasPorAg = new Set(
    (anomalias ?? []).map((a) => a.agencia_id).filter((x): x is string => !!x)
  )

  return agencias
    .map((a): LinhaRankingAgencia => {
      const npsAtual = calcularNPS(atuaisPorAg.get(a.id) ?? [])
      const npsAnt = calcularNPS(anterioresPorAg.get(a.id) ?? [])
      const delta =
        npsAtual.nps !== null && npsAnt.nps !== null
          ? npsAtual.nps - npsAnt.nps
          : null
      return {
        agencia_id: a.id,
        nome: a.nome,
        codigo: a.codigo,
        superintendencia_nome: a.superintendencia_id
          ? mapaSup.get(a.superintendencia_id) ?? null
          : null,
        nps: npsAtual.nps,
        total: npsAtual.total,
        delta,
        temAnomalia: anomaliasPorAg.has(a.id),
      }
    })
    .sort((a, b) => {
      if (a.nps === null && b.nps === null) return 0
      if (a.nps === null) return 1
      if (b.nps === null) return -1
      return b.nps - a.nps
    })
}

// ---------- Distribuição de notas ----------

export async function getDistribuicaoNotas(
  supabase: DB,
  filtros: { agenciaId?: string; bancoId?: string },
  periodo: Periodo
): Promise<{ nota: number; count: number }[]> {
  const { desde } = intervaloDoPeriodo(periodo)
  let q = supabase
    .from('avaliacao')
    .select('nota')
    .eq('status', 'VALIDA')
    .gte('respondido_em', desde)

  if (filtros.agenciaId) q = q.eq('agencia_id', filtros.agenciaId)
  if (filtros.bancoId) q = q.eq('banco_id', filtros.bancoId)

  const { data } = await q

  const contagem = new Map<number, number>()
  for (let i = 0; i <= 10; i++) contagem.set(i, 0)
  for (const r of data ?? []) {
    contagem.set(r.nota, (contagem.get(r.nota) ?? 0) + 1)
  }
  return Array.from(contagem.entries()).map(([nota, count]) => ({
    nota,
    count,
  }))
}

// ---------- Top motivos ----------

export async function getTopMotivos(
  supabase: DB,
  filtros: { agenciaId?: string; bancoId?: string },
  periodo: Periodo
): Promise<{ texto: string; count: number }[]> {
  const { desde } = intervaloDoPeriodo(periodo)

  let qAvals = supabase
    .from('avaliacao')
    .select('id')
    .eq('status', 'VALIDA')
    .gte('respondido_em', desde)
  if (filtros.agenciaId) qAvals = qAvals.eq('agencia_id', filtros.agenciaId)
  if (filtros.bancoId) qAvals = qAvals.eq('banco_id', filtros.bancoId)

  const { data: avals } = await qAvals
  if (!avals || avals.length === 0) return []

  const ids = avals.map((a) => a.id)

  const { data: motivos } = await supabase
    .from('avaliacao_motivo')
    .select('opcao_motivo_id, opcao_motivo:opcao_motivo_id(texto)')
    .in('avaliacao_id', ids)
    .not('opcao_motivo_id', 'is', null)

  const contagem = new Map<string, number>()
  for (const m of motivos ?? []) {
    const op = (m as unknown as { opcao_motivo: { texto: string } | null })
      .opcao_motivo
    if (!op) continue
    contagem.set(op.texto, (contagem.get(op.texto) ?? 0) + 1)
  }

  return Array.from(contagem.entries())
    .map(([texto, count]) => ({ texto, count }))
    .sort((a, b) => b.count - a.count)
}

// ---------- Evolução temporal (semanas) ----------

export async function getEvolucaoNPS(
  supabase: DB,
  filtros: { agenciaId?: string; bancoId?: string },
  periodo: Periodo
): Promise<{ periodo: string; nps: number | null; total: number }[]> {
  const { desde } = intervaloDoPeriodo(periodo)

  let q = supabase
    .from('avaliacao')
    .select('nota, respondido_em')
    .eq('status', 'VALIDA')
    .gte('respondido_em', desde)
    .order('respondido_em', { ascending: true })

  if (filtros.agenciaId) q = q.eq('agencia_id', filtros.agenciaId)
  if (filtros.bancoId) q = q.eq('banco_id', filtros.bancoId)

  const { data } = await q
  if (!data) return []

  // Agrupar por semana ISO 8601 (yyyy-Www)
  const grupos = new Map<string, number[]>()
  for (const r of data) {
    const chave = chaveSemanaISO(new Date(r.respondido_em))
    if (!grupos.has(chave)) grupos.set(chave, [])
    grupos.get(chave)!.push(r.nota)
  }

  return Array.from(grupos.entries()).map(([periodo, notas]) => {
    const res = calcularNPS(notas)
    return { periodo, nps: res.nps, total: res.total }
  })
}

// ---------- Anomalias ----------

export type LinhaAnomalia = {
  id: string
  tipo_anomalia: string
  descricao: string | null
  detectado_em: string
  gr_nome: string | null
  agencia_codigo: string | null
  agencia_nome: string | null
}

export async function getAnomaliasAbertas(
  supabase: DB,
  filtros: { agenciaId?: string; bancoId: string }
): Promise<LinhaAnomalia[]> {
  let q = supabase
    .from('anomalia_log')
    .select(
      `id, tipo_anomalia, descricao, detectado_em,
       gr:gr_id(nome),
       agencia:agencia_id(codigo, nome)`
    )
    .eq('banco_id', filtros.bancoId)
    .eq('resolvido', false)
    .order('detectado_em', { ascending: false })

  if (filtros.agenciaId) q = q.eq('agencia_id', filtros.agenciaId)

  const { data } = await q
  if (!data) return []

  return data.map((r) => {
    const row = r as unknown as {
      id: string
      tipo_anomalia: string
      descricao: string | null
      detectado_em: string
      gr: { nome: string } | null
      agencia: { codigo: string; nome: string } | null
    }
    return {
      id: row.id,
      tipo_anomalia: row.tipo_anomalia,
      descricao: row.descricao,
      detectado_em: row.detectado_em,
      gr_nome: row.gr?.nome ?? null,
      agencia_codigo: row.agencia?.codigo ?? null,
      agencia_nome: row.agencia?.nome ?? null,
    }
  })
}
