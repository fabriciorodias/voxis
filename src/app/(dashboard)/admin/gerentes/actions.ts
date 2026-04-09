'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'

export async function criarGerente(formData: FormData) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const nome = String(formData.get('nome') ?? '').trim()
  const matricula = String(formData.get('matricula') ?? '').trim() || null
  const agenciaId = String(formData.get('agencia_id') ?? '')

  if (!nome || !agenciaId) {
    return { error: 'Nome e agência são obrigatórios' }
  }

  const supabase = await createClient()

  // Garantir que a agência pertence ao banco do usuário
  const { data: agencia } = await supabase
    .from('agencia')
    .select('id')
    .eq('id', agenciaId)
    .eq('banco_id', usuario.banco_id)
    .single()

  if (!agencia) return { error: 'Agência inválida' }

  // Inserir GR (qr_token gerado automaticamente pelo default do schema)
  const { data: gr, error } = await supabase
    .from('gerente_relacionamento')
    .insert({
      banco_id: usuario.banco_id,
      agencia_id: agenciaId,
      nome,
      matricula,
    })
    .select('id')
    .single()

  if (error || !gr) return { error: error?.message ?? 'Erro ao criar gerente' }

  // Registrar o vínculo inicial no histórico
  await supabase.from('historico_vinculo_gr').insert({
    gr_id: gr.id,
    agencia_id: agenciaId,
  })

  revalidatePath('/admin/gerentes')
  return { ok: true }
}

export async function atualizarGerente(formData: FormData) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const id = String(formData.get('id') ?? '')
  const nome = String(formData.get('nome') ?? '').trim()
  const matricula = String(formData.get('matricula') ?? '').trim() || null

  if (!id || !nome) return { error: 'Dados inválidos' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('gerente_relacionamento')
    .update({ nome, matricula })
    .eq('id', id)
    .eq('banco_id', usuario.banco_id)

  if (error) return { error: error.message }
  revalidatePath('/admin/gerentes')
  return { ok: true }
}

export async function alternarGerente(id: string, ativo: boolean) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const supabase = await createClient()
  const { error } = await supabase
    .from('gerente_relacionamento')
    .update({ ativo })
    .eq('id', id)
    .eq('banco_id', usuario.banco_id)

  if (error) return { error: error.message }
  revalidatePath('/admin/gerentes')
  return { ok: true }
}

/**
 * Transfere o GR para uma nova agência.
 * QR TOKEN NÃO MUDA — é a identidade permanente do GR.
 * Fecha o vínculo atual (fim_em = now) e cria um novo.
 */
export async function transferirGerente(formData: FormData) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const grId = String(formData.get('gr_id') ?? '')
  const novaAgenciaId = String(formData.get('nova_agencia_id') ?? '')

  if (!grId || !novaAgenciaId) {
    return { error: 'Dados inválidos' }
  }

  const supabase = await createClient()

  // Validar GR e nova agência no mesmo banco
  const { data: gr } = await supabase
    .from('gerente_relacionamento')
    .select('id, agencia_id')
    .eq('id', grId)
    .eq('banco_id', usuario.banco_id)
    .single()
  if (!gr) return { error: 'Gerente não encontrado' }

  if (gr.agencia_id === novaAgenciaId) {
    return { error: 'O gerente já está nessa agência' }
  }

  const { data: novaAgencia } = await supabase
    .from('agencia')
    .select('id')
    .eq('id', novaAgenciaId)
    .eq('banco_id', usuario.banco_id)
    .single()
  if (!novaAgencia) return { error: 'Agência de destino inválida' }

  const agora = new Date().toISOString()

  // Fechar vínculo atual (o mais recente com fim_em nulo)
  const { error: errFechar } = await supabase
    .from('historico_vinculo_gr')
    .update({ fim_em: agora })
    .eq('gr_id', grId)
    .is('fim_em', null)

  if (errFechar) return { error: errFechar.message }

  // Criar novo vínculo
  const { error: errNovo } = await supabase
    .from('historico_vinculo_gr')
    .insert({
      gr_id: grId,
      agencia_id: novaAgenciaId,
      inicio_em: agora,
    })

  if (errNovo) return { error: errNovo.message }

  // Atualizar GR
  const { error: errGr } = await supabase
    .from('gerente_relacionamento')
    .update({ agencia_id: novaAgenciaId, ativo_desde: agora })
    .eq('id', grId)

  if (errGr) return { error: errGr.message }

  revalidatePath('/admin/gerentes')
  return { ok: true }
}
