import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requerirPerfil } from '@/lib/auth'
import { getDetalhesMotivo, type Periodo } from '@/lib/queries'
import { FiltroPeriodo } from '@/components/dashboard/FiltroPeriodo'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ periodo?: string }>
}

const PERIODOS_VALIDOS: Periodo[] = ['7d', '30d', '90d', '12m']

export default async function DrillDownMotivo({ params, searchParams }: Props) {
  const usuario = await requerirPerfil(['ADMIN', 'DIRECAO'])
  const { id } = await params
  const sp = await searchParams
  const periodo: Periodo = PERIODOS_VALIDOS.includes(sp.periodo as Periodo)
    ? (sp.periodo as Periodo)
    : '30d'

  const supabase = await createClient()

  const detalhes = await getDetalhesMotivo(
    supabase,
    usuario.banco_id,
    id,
    periodo
  )

  if (!detalhes.motivo) notFound()

  const maxSup = Math.max(
    ...detalhes.porSuperintendencia.map((s) => s.count),
    1
  )
  const maxAg = Math.max(...detalhes.porAgencia.map((a) => a.count), 1)

  return (
    <div>
      <div className="mb-2 text-xs text-gray-400">
        <Link href="/painel" className="hover:text-gray-700">
          ← Painel
        </Link>
      </div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase text-gray-500">
            Motivo
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            {detalhes.motivo.texto}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {detalhes.totalCitacoes}{' '}
            {detalhes.totalCitacoes === 1 ? 'citação' : 'citações'} no período
          </p>
        </div>
        <FiltroPeriodo
          atual={periodo}
          basePath={`/painel/motivo/${detalhes.motivo.id}`}
        />
      </header>

      {detalhes.totalCitacoes === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          Este motivo não foi citado no período selecionado.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Superintendências */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Por superintendência
            </h2>
            {detalhes.porSuperintendencia.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                Nenhuma superintendência impactada.
              </p>
            ) : (
              <ul className="space-y-3">
                {detalhes.porSuperintendencia.map((s, i) => (
                  <li key={s.superintendencia_id}>
                    <Link
                      href={`/painel/superintendencia/${s.superintendencia_id}`}
                      className="block rounded-md transition hover:bg-gray-50"
                    >
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900">
                          {i + 1}. {s.nome}
                        </span>
                        <span className="font-mono text-xs text-gray-500">
                          {s.count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded bg-gray-100">
                        <div
                          className="h-full bg-[var(--color-primary)]"
                          style={{ width: `${(s.count / maxSup) * 100}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Agências */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Por agência
            </h2>
            {detalhes.porAgencia.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                Nenhuma agência impactada.
              </p>
            ) : (
              <ul className="space-y-3">
                {detalhes.porAgencia.map((a, i) => (
                  <li key={a.agencia_id}>
                    <Link
                      href={`/painel/agencia/${a.agencia_id}`}
                      className="block rounded-md transition hover:bg-gray-50"
                    >
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium text-gray-900">
                            {i + 1}. {a.nome}
                          </span>
                          <span className="ml-2 font-mono text-[11px] text-gray-400">
                            {a.codigo}
                          </span>
                          {a.superintendencia_nome && (
                            <span className="ml-2 text-[11px] text-gray-500">
                              · {a.superintendencia_nome}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-xs text-gray-500">
                          {a.count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded bg-gray-100">
                        <div
                          className="h-full bg-[var(--color-primary)]"
                          style={{ width: `${(a.count / maxAg) * 100}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
