'use client'

import Link from 'next/link'
import { Tooltip } from '@/components/ui/Tooltip'
import { GLOSSARIO } from '@/lib/glossario'

type Props = {
  total: number
  href: string
}

export function AlertaAnomalia({ total, href }: Props) {
  if (total === 0) return null
  return (
    <Link
      href={href}
      className="mb-6 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200 text-amber-700">
          ⚠
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
            {total} {total === 1 ? 'anomalia aberta' : 'anomalias abertas'}
            <Tooltip content={GLOSSARIO.anomalia.curto} width="wide">
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-700"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                ?
              </span>
            </Tooltip>
          </div>
          <div className="text-xs text-amber-700">
            Avaliações em quarentena aguardando revisão.
          </div>
        </div>
      </div>
      <div className="text-sm font-medium text-amber-700">Revisar →</div>
    </Link>
  )
}
