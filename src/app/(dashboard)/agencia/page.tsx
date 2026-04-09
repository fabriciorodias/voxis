import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAtual } from '@/lib/auth'
import {
  getNPSPorAgencia,
  getRankingGRs,
  getDistribuicaoNotas,
  getTopMotivos,
  getEvolucaoNPS,
  getAnomaliasAbertas,
  type Periodo,
} from '@/lib/queries'
import { CardNPS } from '@/components/dashboard/CardNPS'
import { RankingGRs } from '@/components/dashboard/RankingGRs'
import { GraficoDistribuicao } from '@/components/dashboard/GraficoDistribuicao'
import { TopMotivos } from '@/components/dashboard/TopMotivos'
import { GraficoEvolucao } from '@/components/dashboard/GraficoEvolucao'
import { AlertaAnomalia } from '@/components/dashboard/AlertaAnomalia'
import { FiltroPeriodo } from '@/components/dashboard/FiltroPeriodo'

type Props = {
  searchParams: Promise<{ periodo?: string }>
}

const PERIODOS_VALIDOS: Periodo[] = ['7d', '30d', '90d', '12m']

export default async function AgenciaHome({ searchParams }: Props) {
  const usuario = await getUsuarioAtual()

  // Admin/Direção não têm "minha agência" — redireciona pra direção
  if (usuario.perfil !== 'GESTOR_AGENCIA') {
    redirect('/direcao')
  }

  if (!usuario.agencia_id) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-sm text-gray-500">
          Seu perfil de gestor não está vinculado a nenhuma agência. Contate o
          administrador.
        </p>
      </div>
    )
  }

  const sp = await searchParams
  const periodo: Periodo = PERIODOS_VALIDOS.includes(sp.periodo as Periodo)
    ? (sp.periodo as Periodo)
    : '30d'

  const supabase = await createClient()

  const [{ data: agencia }, nps, ranking, distribuicao, motivos, evolucao, anomalias] =
    await Promise.all([
      supabase
        .from('agencia')
        .select('nome, codigo')
        .eq('id', usuario.agencia_id)
        .single(),
      getNPSPorAgencia(supabase, usuario.agencia_id, periodo),
      getRankingGRs(supabase, usuario.agencia_id, periodo),
      getDistribuicaoNotas(
        supabase,
        { agenciaId: usuario.agencia_id },
        periodo
      ),
      getTopMotivos(supabase, { agenciaId: usuario.agencia_id }, periodo),
      getEvolucaoNPS(supabase, { agenciaId: usuario.agencia_id }, periodo),
      getAnomaliasAbertas(supabase, {
        bancoId: usuario.banco_id,
        agenciaId: usuario.agencia_id,
      }),
    ])

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {agencia?.nome ?? 'Minha agência'}
          </h1>
          <p className="text-sm text-gray-500">
            {agencia?.codigo ? `Código ${agencia.codigo} · ` : ''}Visão do gestor
          </p>
        </div>
        <FiltroPeriodo atual={periodo} basePath="/agencia" />
      </header>

      <AlertaAnomalia total={anomalias.length} href="/agencia/anomalias" />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CardNPS titulo="NPS da agência" dados={nps} subtitulo="vs. período anterior" />
        </div>
        <div className="lg:col-span-2">
          <GraficoDistribuicao dados={distribuicao} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RankingGRs linhas={ranking} />
        </div>
        <div className="lg:col-span-1">
          <TopMotivos dados={motivos} />
        </div>
      </div>

      <div className="mt-5">
        <GraficoEvolucao dados={evolucao} />
      </div>
    </div>
  )
}
