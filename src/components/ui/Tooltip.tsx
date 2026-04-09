'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom'
  width?: 'narrow' | 'medium' | 'wide'
}

const LARGURAS: Record<NonNullable<Props['width']>, string> = {
  narrow: 'w-48',
  medium: 'w-64',
  wide: 'w-80',
}

/**
 * Tooltip simples sem dependências externas.
 * - Desktop: abre no hover, fecha quando o mouse sai (com grace period curto)
 * - Mobile: abre no tap; outro tap (fora) fecha
 * - Acessibilidade: suporta Escape pra fechar
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  width = 'medium',
}: Props) {
  const [aberto, setAberto] = useState(false)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function cancelarFechamento() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  function abrir() {
    cancelarFechamento()
    setAberto(true)
  }

  function agendarFechamento() {
    cancelarFechamento()
    timeoutRef.current = setTimeout(() => {
      setAberto(false)
      timeoutRef.current = null
    }, 200)
  }

  useEffect(() => {
    if (!aberto) return
    function onDocClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [aberto])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const posClass =
    position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex items-center"
      onMouseEnter={abrir}
      onMouseLeave={agendarFechamento}
    >
      <span
        onClick={(e) => {
          e.stopPropagation()
          setAberto((o) => !o)
        }}
        className="inline-flex"
      >
        {children}
      </span>
      {aberto && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 ${posClass} ${LARGURAS[width]} rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-lg`}
        >
          {content}
        </span>
      )}
    </span>
  )
}
