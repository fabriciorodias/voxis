import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'
import { AgenciasClient } from './AgenciasClient'

export default async function AgenciasPage() {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const supabase = await createClient()

  const [{ data: superintendencias }, { data: agencias }] = await Promise.all([
    supabase
      .from('superintendencia')
      .select('id, nome, codigo, ativo')
      .eq('banco_id', usuario.banco_id)
      .order('nome'),
    supabase
      .from('agencia')
      .select('id, nome, codigo, municipio, uf, ativo, superintendencia_id')
      .eq('banco_id', usuario.banco_id)
      .order('codigo'),
  ])

  return (
    <AgenciasClient
      superintendencias={superintendencias ?? []}
      agencias={agencias ?? []}
    />
  )
}
