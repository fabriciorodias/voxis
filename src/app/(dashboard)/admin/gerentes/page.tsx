import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'
import { GerentesClient } from './GerentesClient'

export default async function GerentesPage() {
  const usuario = await requerirPerfil(['ADMIN'])
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <GerentesClient
      gerentes={gerentes ?? []}
      agencias={agencias ?? []}
      appUrl={appUrl}
    />
  )
}
