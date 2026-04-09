import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'
import { UsuariosClient } from './UsuariosClient'

export default async function UsuariosPage() {
  const autor = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const supabase = await createClient()

  const [{ data: usuarios }, { data: agencias }] = await Promise.all([
    supabase
      .from('usuario')
      .select('id, nome, email, perfil, agencia_id, ativo')
      .eq('banco_id', autor.banco_id)
      .order('nome'),
    supabase
      .from('agencia')
      .select('id, nome, codigo, ativo')
      .eq('banco_id', autor.banco_id)
      .order('codigo'),
  ])

  return (
    <UsuariosClient
      usuarios={usuarios ?? []}
      agencias={agencias ?? []}
      meuId={autor.id}
    />
  )
}
