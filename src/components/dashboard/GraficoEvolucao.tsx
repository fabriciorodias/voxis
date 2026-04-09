type Props = {
  dados: { periodo: string; nps: number | null; total: number }[]
}

export function GraficoEvolucao({ dados }: Props) {
  const pontos = dados.filter((d) => d.nps !== null) as {
    periodo: string
    nps: number
    total: number
  }[]

  if (pontos.length < 2) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Evolução do NPS
        </h2>
        <p className="py-6 text-center text-sm text-gray-400">
          Dados insuficientes para traçar evolução temporal.
        </p>
      </div>
    )
  }

  const W = 600
  const H = 160
  const PAD = 24

  const minNps = Math.min(...pontos.map((p) => p.nps), -50)
  const maxNps = Math.max(...pontos.map((p) => p.nps), 100)
  const rangeNps = maxNps - minNps || 1

  const stepX = pontos.length > 1 ? (W - 2 * PAD) / (pontos.length - 1) : 0

  const xyPoints = pontos.map((p, i) => {
    const x = PAD + i * stepX
    const y = H - PAD - ((p.nps - minNps) / rangeNps) * (H - 2 * PAD)
    return { x, y, p }
  })

  const path = xyPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
    .join(' ')

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        Evolução do NPS
      </h2>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="none"
          style={{ minWidth: 320 }}
        >
          {/* Linha do zero */}
          {minNps < 0 && maxNps > 0 && (
            <line
              x1={PAD}
              x2={W - PAD}
              y1={H - PAD - ((0 - minNps) / rangeNps) * (H - 2 * PAD)}
              y2={H - PAD - ((0 - minNps) / rangeNps) * (H - 2 * PAD)}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
            />
          )}
          <path
            d={path}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
          />
          {xyPoints.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill="var(--color-primary)"
              />
              <text
                x={pt.x}
                y={pt.y - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#374151"
                fontWeight="600"
              >
                {pt.p.nps}
              </text>
              <text
                x={pt.x}
                y={H - 6}
                textAnchor="middle"
                fontSize="9"
                fill="#9ca3af"
              >
                {pt.p.periodo.slice(5)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-2 text-[11px] text-gray-400">
        NPS agrupado por semana.
      </div>
    </div>
  )
}
