'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'
import { PRESETS_BANCO, type PresetBanco } from '@/lib/tema'

function ehHex(valor: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(valor)
}

function ehUrl(valor: string): boolean {
  try {
    const u = new URL(valor)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

export async function salvarTema(formData: FormData) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])

  const corPrimaria = String(formData.get('cor_primaria') ?? '').trim()
  const corSecundaria = String(formData.get('cor_secundaria') ?? '').trim()
  const nomeExibicao = String(formData.get('nome_exibicao') ?? '').trim()
  const logoUrlRaw = String(formData.get('logo_url') ?? '').trim()
  const presetRaw = String(formData.get('preset_banco') ?? '').trim()

  if (!ehHex(corPrimaria)) return { error: 'Cor primária inválida (use #RRGGBB)' }
  if (!ehHex(corSecundaria))
    return { error: 'Cor secundária inválida (use #RRGGBB)' }
  if (!nomeExibicao) return { error: 'Nome de exibição é obrigatório' }

  const logoUrl = logoUrlRaw.length > 0 ? logoUrlRaw : null
  if (logoUrl && !ehUrl(logoUrl)) {
    return { error: 'URL do logo inválida' }
  }

  const preset =
    presetRaw && presetRaw in PRESETS_BANCO
      ? (presetRaw as PresetBanco)
      : null

  const supabase = await createClient()
  const { error } = await supabase
    .from('configuracao_tema')
    .update({
      cor_primaria: corPrimaria,
      cor_secundaria: corSecundaria,
      nome_exibicao: nomeExibicao,
      logo_url: logoUrl,
      preset_banco: preset,
      atualizado_em: new Date().toISOString(),
    })
    .eq('banco_id', usuario.banco_id)

  if (error) return { error: error.message }
  revalidatePath('/admin/tema')
  return { ok: true }
}
