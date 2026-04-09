import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'
import {
  getNPSPorSuperintendencia,
  getRankingAgencias,
  getDistribuicaoNotas,
  getTopMotivos,
  getEvolucaoNPS,
  type Periodo,
} from '@/lib/queries'
import { CardNPS } from '@/components/dashboard/CardNPS'
import { RankingAgencias } from '@/components/dashboard/RankingAgencias'
import { GraficoDistribuicao } from '@/components/dashboard/GraficoDistribuicao'
import { TopMotivos } from '@/components/dashboard/TopMotivos'
import { GraficoEvolucao } from '@/components/dashboard/GraficoEvolucao'
import { FiltroPeriodo } from '@/components/dashboard/FiltroPeriodo'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ periodo?: string }>
}

const PERIODOS_VALIDOS: Periodo[] = ['7d', '30d', '90d', '12m']

export default async function DrillDownSuperintendencia({
  params,
  searchParams,
}: Props) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const { id } = await params
  const sp = await searchParams
  const periodo: Periodo = PERIODOS_VALIDOS.includes(sp.periodo as Periodo)
    ? (sp.periodo as Periodo)
    : '30d'

  const supabase = await createClient()

  const { data: sup } = await supabase
    .from('superintendencia')
    .select('id, nome, codigo')
    .eq('id', id)
    .eq('banco_id', usuario.banco_id)
    .single()

  if (!sup) notFound()

  const [nps, ranking, distribuicao, motivos, evolucao] = await Promise.all([
    getNPSPorSuperintendencia(supabase, sup.id, periodo),
    getRankingAgencias(supabase, usuario.banco_id, periodo, {
      superintendenciaId: sup.id,
    }),
    getDistribuicaoNotas(
      supabase,
      { superintendenciaId: sup.id },
      periodo
    ),
    getTopMotivos(supabase, { superintendenciaId: sup.id }, periodo),
    getEvolucaoNPS(supabase, { superintendenciaId: sup.id }, periodo),
  ])

  return (
    <div>
      <div className="mb-2 text-xs text-gray-400">
        <Link href="/painel" className="hover:text-gray-700">
          ← Painel
        </Link>
      </div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{sup.nome}</h1>
          <p className="text-sm text-gray-500">
            {sup.codigo ? `Código ${sup.codigo} · ` : ''}
            Superintendência · {ranking.length}{' '}
            {ranking.length === 1 ? 'agência' : 'agências'}
          </p>
        </div>
        <FiltroPeriodo
          atual={periodo}
          basePath={`/painel/superintendencia/${sup.id}`}
        />
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CardNPS
            titulo="NPS da superintendência"
            dados={nps}
            subtitulo="vs. período anterior"
          />
        </div>
        <div className="lg:col-span-2">
          <GraficoDistribuicao dados={distribuicao} />
        </div>
      </div>

      <div className="mt-5">
        <RankingAgencias linhas={ranking} linkBase="/painel/agencia" />
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
