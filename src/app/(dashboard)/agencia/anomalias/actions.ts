'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'

/**
 * Aprovar: marcar a anomalia como resolvida E promover as avaliações
 * em quarentena associadas ao GR para status VALIDA.
 */
export async function aprovarAnomalia(anomaliaId: string) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO', 'GESTOR_AGENCIA'])
  const supabase = await createClient()

  const { data: anomalia } = await supabase
    .from('anomalia_log')
    .select('id, gr_id, banco_id, agencia_id, tipo_anomalia')
    .eq('id', anomaliaId)
    .eq('banco_id', usuario.banco_id)
    .single()

  if (!anomalia) return { error: 'Anomalia não encontrada' }

  // GESTOR só pode atuar na própria agência
  if (
    usuario.perfil === 'GESTOR_AGENCIA' &&
    anomalia.agencia_id !== usuario.agencia_id
  ) {
    return { error: 'Sem permissão para esta agência' }
  }

  // Promover avaliações em quarentena desse GR com o mesmo motivo
  if (anomalia.gr_id) {
    const { error: errUpd } = await supabase
      .from('avaliacao')
      .update({ status: 'VALIDA' })
      .eq('gr_id', anomalia.gr_id)
      .eq('status', 'QUARENTENA')
      .eq('motivo_quarentena', anomalia.tipo_anomalia)

    if (errUpd) return { error: errUpd.message }
  }

  // Marcar anomalia como resolvida
  const { error } = await supabase
    .from('anomalia_log')
    .update({
      resolvido: true,
      resolvido_por: usuario.id,
      resolvido_em: new Date().toISOString(),
    })
    .eq('id', anomaliaId)

  if (error) return { error: error.message }

  revalidatePath('/agencia/anomalias')
  revalidatePath('/agencia')
  revalidatePath('/painel')
  return { ok: true }
}

/**
 * Rejeitar: marcar a anomalia como resolvida E promover as avaliações
 * em quarentena para status REJEITADA (excluídas do cálculo NPS).
 */
export async function rejeitarAnomalia(anomaliaId: string) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO', 'GESTOR_AGENCIA'])
  const supabase = await createClient()

  const { data: anomalia } = await supabase
    .from('anomalia_log')
    .select('id, gr_id, banco_id, agencia_id, tipo_anomalia')
    .eq('id', anomaliaId)
    .eq('banco_id', usuario.banco_id)
    .single()

  if (!anomalia) return { error: 'Anomalia não encontrada' }

  if (
    usuario.perfil === 'GESTOR_AGENCIA' &&
    anomalia.agencia_id !== usuario.agencia_id
  ) {
    return { error: 'Sem permissão para esta agência' }
  }

  if (anomalia.gr_id) {
    const { error: errUpd } = await supabase
      .from('avaliacao')
      .update({ status: 'REJEITADA' })
      .eq('gr_id', anomalia.gr_id)
      .eq('status', 'QUARENTENA')
      .eq('motivo_quarentena', anomalia.tipo_anomalia)

    if (errUpd) return { error: errUpd.message }
  }

  const { error } = await supabase
    .from('anomalia_log')
    .update({
      resolvido: true,
      resolvido_por: usuario.id,
      resolvido_em: new Date().toISOString(),
    })
    .eq('id', anomaliaId)

  if (error) return { error: error.message }

  revalidatePath('/agencia/anomalias')
  revalidatePath('/agencia')
  revalidatePath('/painel')
  return { ok: true }
}
