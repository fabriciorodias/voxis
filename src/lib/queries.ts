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

// ---------- NPS por superintendência ----------

export async function getNPSPorSuperintendencia(
  supabase: DB,
  superintendenciaId: string,
  periodo: Periodo
): Promise<ResultadoNPS & { delta: number | null }> {
  const { desde, ateAnterior, desdeAnterior } = intervaloDoPeriodo(periodo)

  // Buscar agências dessa sup
  const { data: ags } = await supabase
    .from('agencia')
    .select('id')
    .eq('superintendencia_id', superintendenciaId)

  const agIds = (ags ?? []).map((a) => a.id)
  if (agIds.length === 0) {
    const vazio = calcularNPS([])
    return { ...vazio, delta: null }
  }

  const [{ data: atuais }, { data: anteriores }] = await Promise.all([
    supabase
      .from('avaliacao')
      .select('nota')
      .in('agencia_id', agIds)
      .eq('status', 'VALIDA')
      .gte('respondido_em', desde),
    supabase
      .from('avaliacao')
      .select('nota')
      .in('agencia_id', agIds)
      .eq('status', 'VALIDA')
      .gte('respondido_em', desdeAnterior)
      .lt('respondido_em', ateAnterior),
  ])

  const npsAtual = calcularNPS((atuais ?? []).map((x) => x.nota))
  const npsAnt = calcularNPS((anteriores ?? []).map((x) => x.nota))
  const delta =
    npsAtual.nps !== null && npsAnt.nps !== null
      ? npsAtual.nps - npsAnt.nps
      : null

  return { ...npsAtual, delta }
}

// ---------- Ranking de superintendências ----------

export type LinhaRankingSup = {
  superintendencia_id: string
  nome: string
  codigo: string | null
  nps: number | null
  total: number
  delta: number | null
  totalAgencias: number
  temAnomalia: boolean
}

export async function getRankingSuperintendencias(
  supabase: DB,
  bancoId: string,
  periodo: Periodo
): Promise<LinhaRankingSup[]> {
  const { desde, ateAnterior, desdeAnterior } = intervaloDoPeriodo(periodo)

  const { data: sups } = await supabase
    .from('superintendencia')
    .select('id, nome, codigo, ativo')
    .eq('banco_id', bancoId)
    .eq('ativo', true)
    .order('nome')

  if (!sups || sups.length === 0) return []

  const { data: agencias } = await supabase
    .from('agencia')
    .select('id, superintendencia_id')
    .eq('banco_id', bancoId)
    .eq('ativo', true)
    .not('superintendencia_id', 'is', null)

  // Mapa sup → [agencia_ids]
  const agenciasPorSup = new Map<string, string[]>()
  const supPorAgencia = new Map<string, string>()
  for (const a of agencias ?? []) {
    if (!a.superintendencia_id) continue
    supPorAgencia.set(a.id, a.superintendencia_id)
    if (!agenciasPorSup.has(a.superintendencia_id)) {
      agenciasPorSup.set(a.superintendencia_id, [])
    }
    agenciasPorSup.get(a.superintendencia_id)!.push(a.id)
  }

  const todasIds = (agencias ?? []).map((a) => a.id)
  if (todasIds.length === 0) {
    return sups.map(
      (s): LinhaRankingSup => ({
        superintendencia_id: s.id,
        nome: s.nome,
        codigo: s.codigo,
        nps: null,
        total: 0,
        delta: null,
        totalAgencias: 0,
        temAnomalia: false,
      })
    )
  }

  const [{ data: atuais }, { data: anteriores }, { data: anomalias }] =
    await Promise.all([
      supabase
        .from('avaliacao')
        .select('agencia_id, nota')
        .in('agencia_id', todasIds)
        .eq('status', 'VALIDA')
        .gte('respondido_em', desde),
      supabase
        .from('avaliacao')
        .select('agencia_id, nota')
        .in('agencia_id', todasIds)
        .eq('status', 'VALIDA')
        .gte('respondido_em', desdeAnterior)
        .lt('respondido_em', ateAnterior),
      supabase
        .from('anomalia_log')
        .select('agencia_id')
        .in('agencia_id', todasIds)
        .eq('resolvido', false),
    ])

  const atuaisPorSup = new Map<string, number[]>()
  for (const r of atuais ?? []) {
    const supId = supPorAgencia.get(r.agencia_id)
    if (!supId) continue
    if (!atuaisPorSup.has(supId)) atuaisPorSup.set(supId, [])
    atuaisPorSup.get(supId)!.push(r.nota)
  }
  const anterioresPorSup = new Map<string, number[]>()
  for (const r of anteriores ?? []) {
    const supId = supPorAgencia.get(r.agencia_id)
    if (!supId) continue
    if (!anterioresPorSup.has(supId)) anterioresPorSup.set(supId, [])
    anterioresPorSup.get(supId)!.push(r.nota)
  }
  const supsComAnomalia = new Set<string>()
  for (const a of anomalias ?? []) {
    if (!a.agencia_id) continue
    const supId = supPorAgencia.get(a.agencia_id)
    if (supId) supsComAnomalia.add(supId)
  }

  return sups
    .map((s): LinhaRankingSup => {
      const notas = atuaisPorSup.get(s.id) ?? []
      const notasAnt = anterioresPorSup.get(s.id) ?? []
      const npsAtual = calcularNPS(notas)
      const npsAnt = calcularNPS(notasAnt)
      const delta =
        npsAtual.nps !== null && npsAnt.nps !== null
          ? npsAtual.nps - npsAnt.nps
          : null
      return {
        superintendencia_id: s.id,
        nome: s.nome,
        codigo: s.codigo,
        nps: npsAtual.nps,
        total: npsAtual.total,
        delta,
        totalAgencias: agenciasPorSup.get(s.id)?.length ?? 0,
        temAnomalia: supsComAnomalia.has(s.id),
      }
    })
    .sort((a, b) => {
      if (a.nps === null && b.nps === null) return 0
      if (a.nps === null) return 1
      if (b.nps === null) return -1
      return b.nps - a.nps
    })
}

// ---------- Detalhes de um motivo (página dedicada) ----------

export type DetalhesMotivo = {
  motivo: { id: string; texto: string } | null
  totalCitacoes: number
  porSuperintendencia: {
    superintendencia_id: string
    nome: string
    count: number
  }[]
  porAgencia: {
    agencia_id: string
    nome: string
    codigo: string
    superintendencia_nome: string | null
    count: number
  }[]
}

export async function getDetalhesMotivo(
  supabase: DB,
  bancoId: string,
  motivoId: string,
  periodo: Periodo
): Promise<DetalhesMotivo> {
  const { desde } = intervaloDoPeriodo(periodo)

  // 1. Info do motivo
  const { data: motivo } = await supabase
    .from('opcao_motivo')
    .select('id, texto')
    .eq('id', motivoId)
    .eq('banco_id', bancoId)
    .single()

  if (!motivo) {
    return {
      motivo: null,
      totalCitacoes: 0,
      porSuperintendencia: [],
      porAgencia: [],
    }
  }

  // 2. Todas as avaliações válidas no período
  const { data: avals } = await supabase
    .from('avaliacao')
    .select('id, agencia_id')
    .eq('banco_id', bancoId)
    .eq('status', 'VALIDA')
    .gte('respondido_em', desde)

  if (!avals || avals.length === 0) {
    return { motivo, totalCitacoes: 0, porSuperintendencia: [], porAgencia: [] }
  }

  const avalIds = avals.map((a) => a.id)
  const agenciaPorAval = new Map(avals.map((a) => [a.id, a.agencia_id]))

  // 3. Filtrar avaliacao_motivo pra esse motivo
  const { data: amotivos } = await supabase
    .from('avaliacao_motivo')
    .select('avaliacao_id')
    .eq('opcao_motivo_id', motivoId)
    .in('avaliacao_id', avalIds)

  if (!amotivos || amotivos.length === 0) {
    return { motivo, totalCitacoes: 0, porSuperintendencia: [], porAgencia: [] }
  }

  // 4. Contar por agência
  const countPorAgencia = new Map<string, number>()
  for (const am of amotivos) {
    const agId = agenciaPorAval.get(am.avaliacao_id)
    if (!agId) continue
    countPorAgencia.set(agId, (countPorAgencia.get(agId) ?? 0) + 1)
  }

  const agenciaIds = Array.from(countPorAgencia.keys())
  if (agenciaIds.length === 0) {
    return {
      motivo,
      totalCitacoes: amotivos.length,
      porSuperintendencia: [],
      porAgencia: [],
    }
  }

  // 5. Buscar agências + sups
  const { data: agencias } = await supabase
    .from('agencia')
    .select('id, nome, codigo, superintendencia_id')
    .in('id', agenciaIds)

  const supIds = Array.from(
    new Set(
      (agencias ?? [])
        .map((a) => a.superintendencia_id)
        .filter((x): x is string => !!x)
    )
  )

  const { data: sups } = supIds.length
    ? await supabase
        .from('superintendencia')
        .select('id, nome')
        .in('id', supIds)
    : { data: [] }
  const mapaSup = new Map((sups ?? []).map((s) => [s.id, s.nome]))

  // 6. Montar ranking por agência
  const porAgencia = (agencias ?? [])
    .map((a) => ({
      agencia_id: a.id,
      nome: a.nome,
      codigo: a.codigo,
      superintendencia_nome: a.superintendencia_id
        ? mapaSup.get(a.superintendencia_id) ?? null
        : null,
      count: countPorAgencia.get(a.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count)

  // 7. Agregar por sup
  const countPorSup = new Map<string, { nome: string; count: number }>()
  for (const a of agencias ?? []) {
    if (!a.superintendencia_id) continue
    const nome = mapaSup.get(a.superintendencia_id)
    if (!nome) continue
    const c = countPorAgencia.get(a.id) ?? 0
    const cur = countPorSup.get(a.superintendencia_id)
    if (cur) cur.count += c
    else countPorSup.set(a.superintendencia_id, { nome, count: c })
  }
  const porSuperintendencia = Array.from(countPorSup.entries())
    .map(([id, v]) => ({
      superintendencia_id: id,
      nome: v.nome,
      count: v.count,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    motivo,
    totalCitacoes: amotivos.length,
    porSuperintendencia,
    porAgencia,
  }
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
  periodo: Periodo,
  opts: { superintendenciaId?: string } = {}
): Promise<LinhaRankingAgencia[]> {
  const { desde, ateAnterior, desdeAnterior } = intervaloDoPeriodo(periodo)

  let q = supabase
    .from('agencia')
    .select('id, nome, codigo, superintendencia_id')
    .eq('banco_id', bancoId)
    .eq('ativo', true)
    .order('codigo')
  if (opts.superintendenciaId) {
    q = q.eq('superintendencia_id', opts.superintendenciaId)
  }
  const { data: agencias } = await q

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
  filtros: { agenciaId?: string; bancoId?: string; superintendenciaId?: string },
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

  if (filtros.superintendenciaId) {
    const { data: ags } = await supabase
      .from('agencia')
      .select('id')
      .eq('superintendencia_id', filtros.superintendenciaId)
    const agIds = (ags ?? []).map((a) => a.id)
    if (agIds.length === 0) {
      return Array.from({ length: 11 }, (_, i) => ({ nota: i, count: 0 }))
    }
    q = q.in('agencia_id', agIds)
  }

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

export type LinhaTopMotivo = {
  id: string
  texto: string
  count: number
}

export async function getTopMotivos(
  supabase: DB,
  filtros: { agenciaId?: string; bancoId?: string; superintendenciaId?: string },
  periodo: Periodo
): Promise<LinhaTopMotivo[]> {
  const { desde } = intervaloDoPeriodo(periodo)

  let qAvals = supabase
    .from('avaliacao')
    .select('id')
    .eq('status', 'VALIDA')
    .gte('respondido_em', desde)
  if (filtros.agenciaId) qAvals = qAvals.eq('agencia_id', filtros.agenciaId)
  if (filtros.bancoId) qAvals = qAvals.eq('banco_id', filtros.bancoId)

  if (filtros.superintendenciaId) {
    // Preciso filtrar por agências dessa sup
    const { data: ags } = await supabase
      .from('agencia')
      .select('id')
      .eq('superintendencia_id', filtros.superintendenciaId)
    const agIds = (ags ?? []).map((a) => a.id)
    if (agIds.length === 0) return []
    qAvals = qAvals.in('agencia_id', agIds)
  }

  const { data: avals } = await qAvals
  if (!avals || avals.length === 0) return []

  const ids = avals.map((a) => a.id)

  const { data: motivos } = await supabase
    .from('avaliacao_motivo')
    .select('opcao_motivo_id, opcao_motivo:opcao_motivo_id(id, texto)')
    .in('avaliacao_id', ids)
    .not('opcao_motivo_id', 'is', null)

  const contagem = new Map<string, { texto: string; count: number }>()
  for (const m of motivos ?? []) {
    const op = (
      m as unknown as { opcao_motivo: { id: string; texto: string } | null }
    ).opcao_motivo
    if (!op) continue
    const cur = contagem.get(op.id)
    if (cur) cur.count++
    else contagem.set(op.id, { texto: op.texto, count: 1 })
  }

  return Array.from(contagem.entries())
    .map(([id, v]) => ({ id, texto: v.texto, count: v.count }))
    .sort((a, b) => b.count - a.count)
}

// ---------- Evolução temporal (semanas) ----------

export async function getEvolucaoNPS(
  supabase: DB,
  filtros: { agenciaId?: string; bancoId?: string; superintendenciaId?: string },
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

  if (filtros.superintendenciaId) {
    const { data: ags } = await supabase
      .from('agencia')
      .select('id')
      .eq('superintendencia_id', filtros.superintendenciaId)
    const agIds = (ags ?? []).map((a) => a.id)
    if (agIds.length === 0) return []
    q = q.in('agencia_id', agIds)
  }

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
