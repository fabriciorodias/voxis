import Link from 'next/link'
import type { LinhaRankingGR } from '@/lib/queries'

type Props = {
  linhas: LinhaRankingGR[]
}

function corNPS(nps: number | null): string {
  if (nps === null) return 'text-gray-400'
  if (nps >= 75) return 'text-green-600'
  if (nps >= 50) return 'text-blue-600'
  if (nps >= 0) return 'text-yellow-600'
  return 'text-red-600'
}

export function RankingGRs({ linhas }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        Ranking de gerentes
      </h2>

      {linhas.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          Nenhum gerente ativo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="pb-2 pr-4 font-medium">#</th>
                <th className="pb-2 pr-4 font-medium">Gerente</th>
                <th className="pb-2 pr-4 font-medium text-right">NPS</th>
                <th className="pb-2 pr-4 font-medium text-right">Respostas</th>
                <th className="pb-2 pr-4 font-medium text-right">Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {linhas.map((gr, i) => (
                <tr key={gr.gr_id}>
                  <td className="py-3 pr-4 text-xs text-gray-400">{i + 1}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {gr.nome}
                      </span>
                      {gr.temAnomalia && (
                        <Link
                          href="/agencia/anomalias"
                          title="Há anomalias abertas para este GR"
                          className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-700 hover:bg-amber-200"
                        >
                          ⚠ anomalia
                        </Link>
                      )}
                    </div>
                    {gr.matricula && (
                      <div className="font-mono text-[11px] text-gray-400">
                        {gr.matricula}
                      </div>
                    )}
                  </td>
                  <td className={`py-3 pr-4 text-right font-mono text-base font-semibold ${corNPS(gr.nps)}`}>
                    {gr.nps === null ? '—' : gr.nps}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-xs text-gray-500">
                    {gr.total}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-xs">
                    {gr.delta === null ? (
                      <span className="text-gray-300">—</span>
                    ) : gr.delta > 0 ? (
                      <span className="text-green-600">+{gr.delta}</span>
                    ) : gr.delta < 0 ? (
                      <span className="text-red-600">{gr.delta}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
