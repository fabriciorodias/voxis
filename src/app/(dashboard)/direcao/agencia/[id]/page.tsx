import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'
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
  params: Promise<{ id: string }>
  searchParams: Promise<{ periodo?: string }>
}

const PERIODOS_VALIDOS: Periodo[] = ['7d', '30d', '90d', '12m']

export default async function DrillDownAgencia({
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

  const { data: agencia } = await supabase
    .from('agencia')
    .select('id, nome, codigo, municipio, uf, superintendencia_id')
    .eq('id', id)
    .eq('banco_id', usuario.banco_id)
    .single()

  if (!agencia) notFound()

  const { data: sup } = agencia.superintendencia_id
    ? await supabase
        .from('superintendencia')
        .select('nome')
        .eq('id', agencia.superintendencia_id)
        .single()
    : { data: null }

  const [nps, ranking, distribuicao, motivos, evolucao, anomalias] =
    await Promise.all([
      getNPSPorAgencia(supabase, agencia.id, periodo),
      getRankingGRs(supabase, agencia.id, periodo),
      getDistribuicaoNotas(supabase, { agenciaId: agencia.id }, periodo),
      getTopMotivos(supabase, { agenciaId: agencia.id }, periodo),
      getEvolucaoNPS(supabase, { agenciaId: agencia.id }, periodo),
      getAnomaliasAbertas(supabase, {
        bancoId: usuario.banco_id,
        agenciaId: agencia.id,
      }),
    ])

  return (
    <div>
      <div className="mb-2 text-xs text-gray-400">
        <Link href="/direcao" className="hover:text-gray-700">
          ← Direção
        </Link>
      </div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{agencia.nome}</h1>
          <p className="text-sm text-gray-500">
            Código {agencia.codigo}
            {agencia.municipio && ` · ${agencia.municipio}`}
            {agencia.uf && `/${agencia.uf}`}
            {sup && ` · ${sup.nome}`}
          </p>
        </div>
        <FiltroPeriodo
          atual={periodo}
          basePath={`/direcao/agencia/${agencia.id}`}
        />
      </header>

      <AlertaAnomalia total={anomalias.length} href="/agencia/anomalias" />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CardNPS
            titulo="NPS da agência"
            dados={nps}
            subtitulo="vs. período anterior"
          />
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
