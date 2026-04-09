import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type PerfilUsuario = 'ADMIN' | 'DIRECAO' | 'GESTOR_AGENCIA'

export type UsuarioAtual = {
  id: string
  banco_id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  agencia_id: string | null
}

/**
 * Busca o usuário autenticado + seu perfil na tabela `usuario`.
 * Redireciona para /login se não houver sessão ou perfil.
 */
export async function getUsuarioAtual(): Promise<UsuarioAtual> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuario')
    .select('id, banco_id, nome, email, perfil, agencia_id')
    .eq('id', user.id)
    .single()

  if (!usuario) redirect('/login')

  return usuario as UsuarioAtual
}

/**
 * Garante que o usuário tem um dos perfis permitidos.
 * Redireciona para /login se não tiver.
 */
export async function requerirPerfil(
  perfis: PerfilUsuario[]
): Promise<UsuarioAtual> {
  const usuario = await getUsuarioAtual()
  if (!perfis.includes(usuario.perfil)) {
    redirect('/login')
  }
  return usuario
}
