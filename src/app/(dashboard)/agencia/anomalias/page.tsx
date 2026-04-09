import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'
import { getAnomaliasAbertas } from '@/lib/queries'
import { AnomaliasClient } from './AnomaliasClient'

export default async function AnomaliasPage() {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO', 'GESTOR_AGENCIA'])
  const supabase = await createClient()

  // GESTOR vê só sua agência; ADMIN/DIRECAO veem tudo
  const filtro =
    usuario.perfil === 'GESTOR_AGENCIA' && usuario.agencia_id
      ? { bancoId: usuario.banco_id, agenciaId: usuario.agencia_id }
      : { bancoId: usuario.banco_id }

  const anomalias = await getAnomaliasAbertas(supabase, filtro)

  // Para cada anomalia, contar avaliações em quarentena associadas
  const anomaliasComContagem = await Promise.all(
    anomalias.map(async (a) => {
      const { data: anomaliaDetalhe } = await supabase
        .from('anomalia_log')
        .select('gr_id, tipo_anomalia')
        .eq('id', a.id)
        .single()

      let countQuarentena = 0
      if (anomaliaDetalhe?.gr_id) {
        const { count } = await supabase
          .from('avaliacao')
          .select('*', { count: 'exact', head: true })
          .eq('gr_id', anomaliaDetalhe.gr_id)
          .eq('status', 'QUARENTENA')
          .eq('motivo_quarentena', anomaliaDetalhe.tipo_anomalia)
        countQuarentena = count ?? 0
      }

      return { ...a, avaliacoes_afetadas: countQuarentena }
    })
  )

  return <AnomaliasClient anomalias={anomaliasComContagem} />
}
