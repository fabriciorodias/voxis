type Props = {
  dados: { nota: number; count: number }[]
}

function corNota(n: number): string {
  if (n <= 6) return 'bg-red-500'
  if (n <= 8) return 'bg-amber-500'
  return 'bg-green-500'
}

export function GraficoDistribuicao({ dados }: Props) {
  const total = dados.reduce((acc, d) => acc + d.count, 0)
  const max = Math.max(...dados.map((d) => d.count), 1)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-gray-900">
        Distribuição de notas
      </h2>
      <p className="mb-4 text-xs text-gray-400">
        {total} {total === 1 ? 'resposta' : 'respostas'} no período
      </p>

      {total === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">Sem dados.</p>
      ) : (
        <div className="space-y-1.5">
          {dados.map((d) => (
            <div key={d.nota} className="flex items-center gap-3">
              <div className="w-6 text-right font-mono text-xs text-gray-500">
                {d.nota}
              </div>
              <div className="flex-1">
                <div className="h-5 overflow-hidden rounded bg-gray-100">
                  <div
                    className={`h-full ${corNota(d.nota)}`}
                    style={{ width: `${(d.count / max) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-10 text-right font-mono text-xs text-gray-500">
                {d.count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
