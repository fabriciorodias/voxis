import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'
import { getAppUrl } from '@/lib/appUrl'
import { GerentesClient } from './GerentesClient'

export default async function GerentesPage() {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const supabase = await createClient()

  const [{ data: gerentes }, { data: agencias }] = await Promise.all([
    supabase
      .from('gerente_relacionamento')
      .select('id, nome, matricula, qr_token, ativo, agencia_id, ativo_desde')
      .eq('banco_id', usuario.banco_id)
      .order('nome'),
    supabase
      .from('agencia')
      .select('id, nome, codigo, ativo')
      .eq('banco_id', usuario.banco_id)
      .order('codigo'),
  ])

  return (
    <GerentesClient
      gerentes={gerentes ?? []}
      agencias={agencias ?? []}
      appUrl={getAppUrl()}
    />
  )
}
