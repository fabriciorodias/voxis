import Link from 'next/link'
import type { Periodo } from '@/lib/queries'

type Props = {
  atual: Periodo
  basePath: string
}

const OPCOES: { valor: Periodo; label: string }[] = [
  { valor: '7d', label: '7 dias' },
  { valor: '30d', label: '30 dias' },
  { valor: '90d', label: '90 dias' },
  { valor: '12m', label: '12 meses' },
]

export function FiltroPeriodo({ atual, basePath }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
      {OPCOES.map((o) => {
        const ativo = o.valor === atual
        return (
          <Link
            key={o.valor}
            href={`${basePath}?periodo=${o.valor}`}
            className={`rounded-md px-3 py-1 transition ${
              ativo
                ? 'bg-[var(--color-primary)] font-semibold text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {o.label}
          </Link>
        )
      })}
    </div>
  )
}
