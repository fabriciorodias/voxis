import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'
import {
  getNPSPorBanco,
  getRankingAgencias,
  getRankingSuperintendencias,
  getDistribuicaoNotas,
  getTopMotivos,
  getEvolucaoNPS,
  getAnomaliasAbertas,
  type Periodo,
} from '@/lib/queries'
import { CardNPS } from '@/components/dashboard/CardNPS'
import { RankingAgencias } from '@/components/dashboard/RankingAgencias'
import { RankingSuperintendencias } from '@/components/dashboard/RankingSuperintendencias'
import { GraficoDistribuicao } from '@/components/dashboard/GraficoDistribuicao'
import { TopMotivos } from '@/components/dashboard/TopMotivos'
import { GraficoEvolucao } from '@/components/dashboard/GraficoEvolucao'
import { AlertaAnomalia } from '@/components/dashboard/AlertaAnomalia'
import { FiltroPeriodo } from '@/components/dashboard/FiltroPeriodo'

type Props = {
  searchParams: Promise<{ periodo?: string }>
}

const PERIODOS_VALIDOS: Periodo[] = ['7d', '30d', '90d', '12m']

export default async function PainelHome({ searchParams }: Props) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const sp = await searchParams
  const periodo: Periodo = PERIODOS_VALIDOS.includes(sp.periodo as Periodo)
    ? (sp.periodo as Periodo)
    : '30d'

  const supabase = await createClient()

  const [
    nps,
    rankingSups,
    rankingAgs,
    distribuicao,
    motivos,
    evolucao,
    anomalias,
  ] = await Promise.all([
    getNPSPorBanco(supabase, usuario.banco_id, periodo),
    getRankingSuperintendencias(supabase, usuario.banco_id, periodo),
    getRankingAgencias(supabase, usuario.banco_id, periodo),
    getDistribuicaoNotas(supabase, { bancoId: usuario.banco_id }, periodo),
    getTopMotivos(supabase, { bancoId: usuario.banco_id }, periodo),
    getEvolucaoNPS(supabase, { bancoId: usuario.banco_id }, periodo),
    getAnomaliasAbertas(supabase, { bancoId: usuario.banco_id }),
  ])

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel</h1>
          <p className="text-sm text-gray-500">
            Visão consolidada da rede de agências.
          </p>
        </div>
        <FiltroPeriodo atual={periodo} basePath="/painel" />
      </header>

      <AlertaAnomalia total={anomalias.length} href="/agencia/anomalias" />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CardNPS
            titulo="NPS do banco"
            dados={nps}
            subtitulo="vs. período anterior"
          />
        </div>
        <div className="lg:col-span-2">
          <GraficoDistribuicao dados={distribuicao} />
        </div>
      </div>

      <div className="mt-5">
        <RankingSuperintendencias
          linhas={rankingSups}
          linkBase="/painel/superintendencia"
        />
      </div>

      <div className="mt-5">
        <RankingAgencias linhas={rankingAgs} linkBase="/painel/agencia" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GraficoEvolucao dados={evolucao} />
        </div>
        <div className="lg:col-span-1">
          <TopMotivos dados={motivos} linkBase="/painel/motivo" />
        </div>
      </div>
    </div>
  )
}
