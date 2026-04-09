'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'

// ---------- Superintendência ----------

export async function criarSuperintendencia(formData: FormData) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const nome = String(formData.get('nome') ?? '').trim()
  const codigo = String(formData.get('codigo') ?? '').trim() || null

  if (!nome) return { error: 'Nome é obrigatório' }

  const supabase = await createClient()
  const { error } = await supabase.from('superintendencia').insert({
    banco_id: usuario.banco_id,
    nome,
    codigo,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/agencias')
  return { ok: true }
}

export async function atualizarSuperintendencia(formData: FormData) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const id = String(formData.get('id') ?? '')
  const nome = String(formData.get('nome') ?? '').trim()
  const codigo = String(formData.get('codigo') ?? '').trim() || null

  if (!id || !nome) return { error: 'Dados inválidos' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('superintendencia')
    .update({ nome, codigo })
    .eq('id', id)
    .eq('banco_id', usuario.banco_id)

  if (error) return { error: error.message }
  revalidatePath('/admin/agencias')
  return { ok: true }
}

export async function alternarSuperintendencia(id: string, ativo: boolean) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const supabase = await createClient()
  const { error } = await supabase
    .from('superintendencia')
    .update({ ativo })
    .eq('id', id)
    .eq('banco_id', usuario.banco_id)

  if (error) return { error: error.message }
  revalidatePath('/admin/agencias')
  return { ok: true }
}

// ---------- Agência ----------

export async function criarAgencia(formData: FormData) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const nome = String(formData.get('nome') ?? '').trim()
  const codigo = String(formData.get('codigo') ?? '').trim()
  const municipio = String(formData.get('municipio') ?? '').trim() || null
  const ufRaw = String(formData.get('uf') ?? '').trim().toUpperCase()
  const uf = ufRaw.length === 2 ? ufRaw : null
  const superintendenciaId =
    String(formData.get('superintendencia_id') ?? '') || null

  if (!nome || !codigo) {
    return { error: 'Nome e código são obrigatórios' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('agencia').insert({
    banco_id: usuario.banco_id,
    nome,
    codigo,
    municipio,
    uf,
    superintendencia_id: superintendenciaId,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/agencias')
  return { ok: true }
}

export async function atualizarAgencia(formData: FormData) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const id = String(formData.get('id') ?? '')
  const nome = String(formData.get('nome') ?? '').trim()
  const codigo = String(formData.get('codigo') ?? '').trim()
  const municipio = String(formData.get('municipio') ?? '').trim() || null
  const ufRaw = String(formData.get('uf') ?? '').trim().toUpperCase()
  const uf = ufRaw.length === 2 ? ufRaw : null
  const superintendenciaId =
    String(formData.get('superintendencia_id') ?? '') || null

  if (!id || !nome || !codigo) {
    return { error: 'Dados inválidos' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('agencia')
    .update({
      nome,
      codigo,
      municipio,
      uf,
      superintendencia_id: superintendenciaId,
    })
    .eq('id', id)
    .eq('banco_id', usuario.banco_id)

  if (error) return { error: error.message }
  revalidatePath('/admin/agencias')
  return { ok: true }
}

export async function alternarAgencia(id: string, ativo: boolean) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const supabase = await createClient()
  const { error } = await supabase
    .from('agencia')
    .update({ ativo })
    .eq('id', id)
    .eq('banco_id', usuario.banco_id)

  if (error) return { error: error.message }
  revalidatePath('/admin/agencias')
  return { ok: true }
}
