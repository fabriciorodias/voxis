'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Item = { href: string; label: string }

type Props = {
  label: string
  itens: Item[]
}

const DELAY_FECHAR_MS = 180

export function GrupoDropdown({ label, itens }: Props) {
  const [aberto, setAberto] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
    }, DELAY_FECHAR_MS)
  }

  // Fechar ao clicar fora (útil pra mobile)
  useEffect(() => {
    if (!aberto) return
    function onDocClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
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

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={abrir}
      onMouseLeave={agendarFechamento}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((o) => !o)}
        onFocus={abrir}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        {label}
        <svg
          className={`h-3 w-3 transition-transform ${aberto ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {aberto && (
        // pt-2 cria uma área de hover contígua com o botão (elimina o gap).
        <div
          className="absolute left-0 top-full z-40 pt-2"
          onMouseEnter={cancelarFechamento}
          onMouseLeave={agendarFechamento}
        >
          <div
            role="menu"
            className="w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            {itens.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                role="menuitem"
                onClick={() => setAberto(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {i.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
