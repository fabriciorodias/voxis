import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'
import { MotivosClient } from './MotivosClient'

export default async function MotivosPage() {
  const usuario = await requerirPerfil(['ADMIN'])
  const supabase = await createClient()

  const { data: motivos } = await supabase
    .from('opcao_motivo')
    .select('id, texto, ordem, ativo')
    .eq('banco_id', usuario.banco_id)
    .order('ativo', { ascending: false })
    .order('ordem', { ascending: true })

  return <MotivosClient motivos={motivos ?? []} />
}
