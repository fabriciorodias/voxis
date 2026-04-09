import Link from 'next/link'
import type { LinhaRankingSup } from '@/lib/queries'

type Props = {
  linhas: LinhaRankingSup[]
  linkBase?: string // ex: "/painel/superintendencia"
}

function corNPS(nps: number | null): string {
  if (nps === null) return 'text-gray-400'
  if (nps >= 75) return 'text-green-600'
  if (nps >= 50) return 'text-blue-600'
  if (nps >= 0) return 'text-yellow-600'
  return 'text-red-600'
}

export function RankingSuperintendencias({ linhas, linkBase }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        Ranking de superintendências
      </h2>

      {linhas.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          Nenhuma superintendência cadastrada.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="pb-2 pr-4 font-medium">#</th>
                <th className="pb-2 pr-4 font-medium">Superintendência</th>
                <th className="pb-2 pr-4 font-medium text-right">Agências</th>
                <th className="pb-2 pr-4 font-medium text-right">NPS</th>
                <th className="pb-2 pr-4 font-medium text-right">Respostas</th>
                <th className="pb-2 pr-4 font-medium text-right">Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {linhas.map((s, i) => {
                const conteudoNome = (
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    {s.nome}
                    {s.temAnomalia && (
                      <span
                        title="Há anomalias abertas em agências desta superintendência"
                        className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-700"
                      >
                        ⚠
                      </span>
                    )}
                    {s.codigo && (
                      <span className="font-mono text-[11px] text-gray-400">
                        ({s.codigo})
                      </span>
                    )}
                  </div>
                )
                return (
                  <tr key={s.superintendencia_id}>
                    <td className="py-3 pr-4 text-xs text-gray-400">{i + 1}</td>
                    <td className="py-3 pr-4">
                      {linkBase ? (
                        <Link
                          href={`${linkBase}/${s.superintendencia_id}`}
                          className="hover:underline"
                        >
                          {conteudoNome}
                        </Link>
                      ) : (
                        conteudoNome
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-xs text-gray-500">
                      {s.totalAgencias}
                    </td>
                    <td
                      className={`py-3 pr-4 text-right font-mono text-base font-semibold ${corNPS(
                        s.nps
                      )}`}
                    >
                      {s.nps === null ? '—' : s.nps}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-xs text-gray-500">
                      {s.total}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-xs">
                      {s.delta === null ? (
                        <span className="text-gray-300">—</span>
                      ) : s.delta > 0 ? (
                        <span className="text-green-600">+{s.delta}</span>
                      ) : s.delta < 0 ? (
                        <span className="text-red-600">{s.delta}</span>
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
