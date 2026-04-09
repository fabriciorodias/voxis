import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AvaliacaoCliente } from './AvaliacaoCliente'

type Props = {
  params: Promise<{ token: string }>
}

export default async function AvaliarPage({ params }: Props) {
  const { token } = await params

  const supabase = await createClient()

  // Buscar GR pelo token
  const { data: gr, error: grErr } = await supabase
    .from('gerente_relacionamento')
    .select('id, nome, banco_id, agencia_id, ativo')
    .eq('qr_token', token)
    .single()

  if (grErr || !gr || !gr.ativo) {
    notFound()
  }

  // Buscar tema do banco
  const { data: tema } = await supabase
    .from('configuracao_tema')
    .select('cor_primaria, cor_secundaria, nome_exibicao, logo_url')
    .eq('banco_id', gr.banco_id)
    .single()

  // Buscar nome da agência
  const { data: agencia } = await supabase
    .from('agencia')
    .select('nome, codigo')
    .eq('id', gr.agencia_id)
    .single()

  // Buscar opções de motivo ativas
  const { data: opcoesMotivo } = await supabase
    .from('opcao_motivo')
    .select('id, texto')
    .eq('banco_id', gr.banco_id)
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  return (
    <AvaliacaoCliente
      gr={{ id: gr.id, nome: gr.nome }}
      agencia={agencia ? { nome: agencia.nome, codigo: agencia.codigo } : null}
      tema={{
        corPrimaria: tema?.cor_primaria ?? '#2563EB',
        corSecundaria: tema?.cor_secundaria ?? '#64748B',
        nomeExibicao: tema?.nome_exibicao ?? 'Voxis',
        logoUrl: tema?.logo_url ?? null,
      }}
      opcoesMotivo={opcoesMotivo ?? []}
    />
  )
}
