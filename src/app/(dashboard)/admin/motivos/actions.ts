'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'

const MAX_ATIVOS = 4

async function contarAtivos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bancoId: string
): Promise<number> {
  const { count } = await supabase
    .from('opcao_motivo')
    .select('*', { count: 'exact', head: true })
    .eq('banco_id', bancoId)
    .eq('ativo', true)
  return count ?? 0
}

export async function criarMotivo(formData: FormData) {
  const usuario = await requerirPerfil(['ADMIN'])
  const texto = String(formData.get('texto') ?? '').trim()
  const ordemRaw = String(formData.get('ordem') ?? '').trim()
  const ordem = ordemRaw ? Number(ordemRaw) : 0

  if (!texto) return { error: 'Texto é obrigatório' }
  if (Number.isNaN(ordem)) return { error: 'Ordem inválida' }

  const supabase = await createClient()
  const ativos = await contarAtivos(supabase, usuario.banco_id)
  if (ativos >= MAX_ATIVOS) {
    return {
      error: `Limite de ${MAX_ATIVOS} motivos ativos atingido. Desative um antes de criar outro.`,
    }
  }

  const { error } = await supabase.from('opcao_motivo').insert({
    banco_id: usuario.banco_id,
    texto,
    ordem,
    ativo: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/motivos')
  return { ok: true }
}

export async function atualizarMotivo(formData: FormData) {
  const usuario = await requerirPerfil(['ADMIN'])
  const id = String(formData.get('id') ?? '')
  const texto = String(formData.get('texto') ?? '').trim()
  const ordemRaw = String(formData.get('ordem') ?? '').trim()
  const ordem = ordemRaw ? Number(ordemRaw) : 0

  if (!id || !texto) return { error: 'Dados inválidos' }
  if (Number.isNaN(ordem)) return { error: 'Ordem inválida' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('opcao_motivo')
    .update({ texto, ordem })
    .eq('id', id)
    .eq('banco_id', usuario.banco_id)

  if (error) return { error: error.message }
  revalidatePath('/admin/motivos')
  return { ok: true }
}

export async function alternarMotivo(id: string, novoAtivo: boolean) {
  const usuario = await requerirPerfil(['ADMIN'])
  const supabase = await createClient()

  if (novoAtivo) {
    // Ativar: checar limite
    const ativos = await contarAtivos(supabase, usuario.banco_id)
    if (ativos >= MAX_ATIVOS) {
      return {
        error: `Limite de ${MAX_ATIVOS} motivos ativos atingido. Desative um antes de ativar outro.`,
      }
    }
  }

  const { error } = await supabase
    .from('opcao_motivo')
    .update({ ativo: novoAtivo })
    .eq('id', id)
    .eq('banco_id', usuario.banco_id)

  if (error) return { error: error.message }
  revalidatePath('/admin/motivos')
  return { ok: true }
}
