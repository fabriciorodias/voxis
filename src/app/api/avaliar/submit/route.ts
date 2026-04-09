import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  verificarRateLimit,
  detectarRajada,
  hashString,
} from '@/lib/antifraude'

type SubmitBody = {
  gr_id?: string
  nota?: number
  device_hash?: string
  motivos?: string[]
  motivo_outro?: string
}

export async function POST(request: Request) {
  try {
    const body: SubmitBody = await request.json()
    const { gr_id, nota, device_hash, motivos, motivo_outro } = body

    if (
      !gr_id ||
      typeof nota !== 'number' ||
      nota < 0 ||
      nota > 10 ||
      !device_hash
    ) {
      return NextResponse.json(
        { error: 'Payload inválido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Buscar GR para pegar agencia_id + banco_id + ativo
    const { data: gr, error: grErr } = await supabase
      .from('gerente_relacionamento')
      .select('id, agencia_id, banco_id, ativo')
      .eq('id', gr_id)
      .single()

    if (grErr || !gr || !gr.ativo) {
      return NextResponse.json(
        { error: 'Gerente não encontrado' },
        { status: 404 }
      )
    }

    // 2. Rate limit
    const { permitido } = await verificarRateLimit(supabase, gr_id, device_hash)
    if (!permitido) {
      return NextResponse.json(
        { error: 'Avaliação já registrada nas últimas 24h' },
        { status: 429 }
      )
    }

    // 3. Detectar rajada
    const rajada = await detectarRajada(supabase, gr_id)
    const status: 'VALIDA' | 'QUARENTENA' = rajada ? 'QUARENTENA' : 'VALIDA'
    const motivoQuarentena = rajada ? 'RAJADA_10MIN' : null

    // 4. Hash de IP e user agent (best-effort)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      null
    const ua = request.headers.get('user-agent') ?? null
    const ipHash = ip ? await hashString(ip) : null
    const uaHash = ua ? await hashString(ua) : null

    // 5. Inserir avaliação
    const { data: avaliacao, error: insErr } = await supabase
      .from('avaliacao')
      .insert({
        gr_id,
        agencia_id: gr.agencia_id,
        banco_id: gr.banco_id,
        nota,
        dispositivo_hash: device_hash,
        ip_hash: ipHash,
        user_agent_hash: uaHash,
        status,
        motivo_quarentena: motivoQuarentena,
      })
      .select('id')
      .single()

    if (insErr || !avaliacao) {
      console.error('[submit] insert avaliacao:', insErr)
      return NextResponse.json(
        { error: 'Erro ao salvar avaliação' },
        { status: 500 }
      )
    }

    // 6. Inserir motivos (se houver)
    const registros: {
      avaliacao_id: string
      opcao_motivo_id: string | null
      texto_outro: string | null
    }[] = []

    if (motivos && motivos.length > 0) {
      for (const idMotivo of motivos) {
        registros.push({
          avaliacao_id: avaliacao.id,
          opcao_motivo_id: idMotivo,
          texto_outro: null,
        })
      }
    }
    if (motivo_outro && motivo_outro.trim().length > 0) {
      registros.push({
        avaliacao_id: avaliacao.id,
        opcao_motivo_id: null,
        texto_outro: motivo_outro.trim(),
      })
    }
    if (registros.length > 0) {
      const { error: motErr } = await supabase
        .from('avaliacao_motivo')
        .insert(registros)
      if (motErr) console.error('[submit] insert motivos:', motErr)
    }

    // 7. Log anomalia se rajada
    if (rajada) {
      const { error: anomErr } = await supabase.from('anomalia_log').insert({
        banco_id: gr.banco_id,
        gr_id: gr.id,
        agencia_id: gr.agencia_id,
        tipo_anomalia: 'RAJADA_10MIN',
        descricao: '5+ respostas ao mesmo GR em 10min',
      })
      if (anomErr) console.error('[submit] insert anomalia:', anomErr)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/avaliar/submit] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
