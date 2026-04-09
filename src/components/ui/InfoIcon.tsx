'use client'

import type { ReactNode } from 'react'
import { Tooltip } from './Tooltip'

type Props = {
  content: ReactNode
  className?: string
  position?: 'top' | 'bottom'
  width?: 'narrow' | 'medium' | 'wide'
  'aria-label'?: string
}

/**
 * Botão de ajuda inline. Mostra tooltip com a explicação ao
 * passar o mouse ou ao tocar.
 */
export function InfoIcon({
  content,
  className = '',
  position = 'top',
  width = 'medium',
  'aria-label': ariaLabel = 'Mais informações',
}: Props) {
  return (
    <Tooltip content={content} position={position} width={width}>
      <button
        type="button"
        aria-label={ariaLabel}
        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 transition hover:bg-gray-300 hover:text-gray-800 ${className}`}
      >
        ?
      </button>
    </Tooltip>
  )
}
