'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requerirPerfil, type PerfilUsuario } from '@/lib/auth'

type PerfilInput = PerfilUsuario
const PERFIS_VALIDOS: PerfilInput[] = ['ADMIN', 'DIRECAO', 'GESTOR_AGENCIA']

function gerarSenhaAleatoria(tamanho = 16): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let out = ''
  const bytes = crypto.getRandomValues(new Uint8Array(tamanho))
  for (let i = 0; i < tamanho; i++) {
    out += chars[bytes[i] % chars.length]
  }
  return out
}

export async function criarUsuario(formData: FormData) {
  const autor = await requerirPerfil(['ADMIN', 'DIRECAO'])

  const nome = String(formData.get('nome') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const perfilRaw = String(formData.get('perfil') ?? '') as PerfilInput
  const agenciaIdRaw = String(formData.get('agencia_id') ?? '') || null
  const senhaRaw = String(formData.get('senha') ?? '').trim()

  if (!nome || !email) return { error: 'Nome e email são obrigatórios' }
  if (!PERFIS_VALIDOS.includes(perfilRaw)) return { error: 'Perfil inválido' }

  // GESTOR_AGENCIA precisa ter agência
  if (perfilRaw === 'GESTOR_AGENCIA' && !agenciaIdRaw) {
    return { error: 'Gestor de agência precisa ter uma agência atribuída' }
  }
  // ADMIN e DIRECAO não têm agência
  const agenciaId = perfilRaw === 'GESTOR_AGENCIA' ? agenciaIdRaw : null

  const senha = senhaRaw.length >= 8 ? senhaRaw : gerarSenhaAleatoria()

  const admin = createAdminClient()

  // Validar agência pertence ao banco
  if (agenciaId) {
    const { data: ag } = await admin
      .from('agencia')
      .select('id')
      .eq('id', agenciaId)
      .eq('banco_id', autor.banco_id)
      .single()
    if (!ag) return { error: 'Agência inválida' }
  }

  // Criar auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser(
    {
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    }
  )

  if (authErr || !authData.user) {
    return {
      error:
        authErr?.message ??
        'Erro ao criar usuário no Supabase Auth',
    }
  }

  // Inserir na tabela usuario
  const { error: insErr } = await admin.from('usuario').insert({
    id: authData.user.id,
    banco_id: autor.banco_id,
    nome,
    email,
    perfil: perfilRaw,
    agencia_id: agenciaId,
    ativo: true,
  })

  if (insErr) {
    // Rollback: deletar auth user recém-criado
    await admin.auth.admin.deleteUser(authData.user.id).catch(() => {})
    return { error: insErr.message }
  }

  revalidatePath('/admin/usuarios')
  return { ok: true, senha, email }
}

export async function atualizarUsuario(formData: FormData) {
  const autor = await requerirPerfil(['ADMIN', 'DIRECAO'])

  const id = String(formData.get('id') ?? '')
  const nome = String(formData.get('nome') ?? '').trim()
  const perfilRaw = String(formData.get('perfil') ?? '') as PerfilInput
  const agenciaIdRaw = String(formData.get('agencia_id') ?? '') || null

  if (!id || !nome) return { error: 'Dados inválidos' }
  if (!PERFIS_VALIDOS.includes(perfilRaw)) return { error: 'Perfil inválido' }
  if (perfilRaw === 'GESTOR_AGENCIA' && !agenciaIdRaw) {
    return { error: 'Gestor de agência precisa ter uma agência atribuída' }
  }
  const agenciaId = perfilRaw === 'GESTOR_AGENCIA' ? agenciaIdRaw : null

  // Proteção: admin não pode rebaixar a si mesmo
  if (id === autor.id && perfilRaw !== 'ADMIN') {
    return {
      error: 'Você não pode alterar seu próprio perfil para um não-ADMIN',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('usuario')
    .update({ nome, perfil: perfilRaw, agencia_id: agenciaId })
    .eq('id', id)
    .eq('banco_id', autor.banco_id)

  if (error) return { error: error.message }
  revalidatePath('/admin/usuarios')
  return { ok: true }
}

export async function alternarUsuario(id: string, novoAtivo: boolean) {
  const autor = await requerirPerfil(['ADMIN', 'DIRECAO'])

  // Proteção: admin não pode desativar a si mesmo
  if (id === autor.id && !novoAtivo) {
    return { error: 'Você não pode desativar a si mesmo' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('usuario')
    .update({ ativo: novoAtivo })
    .eq('id', id)
    .eq('banco_id', autor.banco_id)

  if (error) return { error: error.message }
  revalidatePath('/admin/usuarios')
  return { ok: true }
}

export async function resetarSenhaUsuario(id: string) {
  const autor = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const supabase = await createClient()

  // Buscar usuário alvo pra garantir que é do mesmo banco
  const { data: alvo } = await supabase
    .from('usuario')
    .select('id, email')
    .eq('id', id)
    .eq('banco_id', autor.banco_id)
    .single()
  if (!alvo) return { error: 'Usuário não encontrado' }

  const novaSenha = gerarSenhaAleatoria()

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(id, {
    password: novaSenha,
  })

  if (error) return { error: error.message }

  return { ok: true, senha: novaSenha, email: alvo.email }
}
