import Link from 'next/link'
import type { LinhaRankingAgencia } from '@/lib/queries'
import { InfoIcon } from '@/components/ui/InfoIcon'
import { GLOSSARIO } from '@/lib/glossario'

type Props = {
  linhas: LinhaRankingAgencia[]
  linkBase?: string // ex: "/painel/agencia"
}

function corNPS(nps: number | null): string {
  if (nps === null) return 'text-gray-400'
  if (nps >= 75) return 'text-green-600'
  if (nps >= 50) return 'text-blue-600'
  if (nps >= 0) return 'text-yellow-600'
  return 'text-red-600'
}

export function RankingAgencias({ linhas, linkBase }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        Ranking de agências
      </h2>

      {linhas.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          Nenhuma agência ativa.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="pb-2 pr-4 font-medium">#</th>
                <th className="pb-2 pr-4 font-medium">Agência</th>
                <th className="pb-2 pr-4 font-medium">Superintendência</th>
                <th className="pb-2 pr-4 font-medium text-right">
                  <span className="inline-flex items-center justify-end gap-1">
                    NPS
                    <InfoIcon content={GLOSSARIO.nps.curto} width="wide" />
                  </span>
                </th>
                <th className="pb-2 pr-4 font-medium text-right">Respostas</th>
                <th className="pb-2 pr-4 font-medium text-right">
                  <span className="inline-flex items-center justify-end gap-1">
                    Δ
                    <InfoIcon content={GLOSSARIO.delta.curto} width="wide" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {linhas.map((ag, i) => {
                const nomeCel = (
                  <div>
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      {ag.nome}
                      {ag.temAnomalia && (
                        <span
                          title="Agência tem anomalias abertas"
                          className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-700"
                        >
                          ⚠
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-gray-400">
                      {ag.codigo}
                    </div>
                  </div>
                )
                return (
                  <tr key={ag.agencia_id}>
                    <td className="py-3 pr-4 text-xs text-gray-400">{i + 1}</td>
                    <td className="py-3 pr-4">
                      {linkBase ? (
                        <Link
                          href={`${linkBase}/${ag.agencia_id}`}
                          className="hover:underline"
                        >
                          {nomeCel}
                        </Link>
                      ) : (
                        nomeCel
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-500">
                      {ag.superintendencia_nome ?? '—'}
                    </td>
                    <td
                      className={`py-3 pr-4 text-right font-mono text-base font-semibold ${corNPS(
                        ag.nps
                      )}`}
                    >
                      {ag.nps === null ? '—' : ag.nps}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-xs text-gray-500">
                      {ag.total}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-xs">
                      {ag.delta === null ? (
                        <span className="text-gray-300">—</span>
                      ) : ag.delta > 0 ? (
                        <span className="text-green-600">+{ag.delta}</span>
                      ) : ag.delta < 0 ? (
                        <span className="text-red-600">{ag.delta}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
