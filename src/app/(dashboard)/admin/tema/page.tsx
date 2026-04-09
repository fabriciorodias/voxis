import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'
import { TemaClient } from './TemaClient'

export default async function TemaPage() {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const supabase = await createClient()

  const { data: tema } = await supabase
    .from('configuracao_tema')
    .select('cor_primaria, cor_secundaria, nome_exibicao, logo_url, preset_banco')
    .eq('banco_id', usuario.banco_id)
    .single()

  return (
    <TemaClient
      inicial={{
        cor_primaria: tema?.cor_primaria ?? '#2563EB',
        cor_secundaria: tema?.cor_secundaria ?? '#64748B',
        nome_exibicao: tema?.nome_exibicao ?? 'Voxis',
        logo_url: tema?.logo_url ?? '',
        preset_banco: tema?.preset_banco ?? '',
      }}
    />
  )
}
