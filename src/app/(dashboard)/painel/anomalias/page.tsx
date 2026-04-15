import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'
import { getAnomaliasAbertas } from '@/lib/queries'
import { AnomaliasClient } from '@/app/(dashboard)/agencia/anomalias/AnomaliasClient'

export default async function PainelAnomaliasPage() {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const supabase = await createClient()

  const anomalias = await getAnomaliasAbertas(supabase, {
    bancoId: usuario.banco_id,
  })

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
