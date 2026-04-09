'use client'

import { useState } from 'react'

export type OpcaoMotivo = {
  id: string
  texto: string
}

type Props = {
  opcoes: OpcaoMotivo[]
  onSubmit: (motivos: string[], motivoOutro: string | null) => void
  enviando?: boolean
}

export function SelecaoMotivo({ opcoes, onSubmit, enviando }: Props) {
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [textoOutro, setTextoOutro] = useState('')

  function toggle(id: string) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleSubmit() {
    const outro = textoOutro.trim().length > 0 ? textoOutro.trim() : null
    onSubmit(selecionados, outro)
  }

  return (
    <div className="w-full space-y-4">
      <p className="text-base text-gray-700">
        O que mais impactou sua experiência?
      </p>
      <div className="space-y-2">
        {opcoes.map((op) => {
          const ativo = selecionados.includes(op.id)
          return (
            <button
              key={op.id}
              type="button"
              onClick={() => toggle(op.id)}
              className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition ${
                ativo
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                  ativo
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                    : 'border-gray-300'
                }`}
              >
                {ativo && (
                  <svg
                    className="h-3 w-3 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              <span className="text-base text-gray-800">{op.texto}</span>
            </button>
          )
        })}
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600">
          Outro (opcional)
        </label>
        <textarea
          value={textoOutro}
          onChange={(e) => setTextoOutro(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Conte em poucas palavras..."
          className="w-full rounded-lg border border-gray-200 p-3 text-base focus:border-[var(--color-primary)] focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={enviando}
        className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? 'Enviando...' : 'Enviar avaliação'}
      </button>
    </div>
  )
}
