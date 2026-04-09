'use client'

type Props = {
  onSelect: (nota: number) => void
  disabled?: boolean
}

function corBotao(n: number): string {
  if (n <= 6) return 'bg-red-500 hover:bg-red-600'
  if (n <= 8) return 'bg-amber-500 hover:bg-amber-600'
  return 'bg-green-500 hover:bg-green-600'
}

export function EscalaNPS({ onSelect, disabled }: Props) {
  const notas = Array.from({ length: 11 }, (_, i) => i) // 0..10

  return (
    <div className="w-full">
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
        {notas.map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(n)}
            aria-label={`Nota ${n}`}
            className={`${corBotao(
              n
            )} flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg text-lg font-bold text-white shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-between px-1 text-xs text-gray-500">
        <span>Nada provável</span>
        <span>Muito provável</span>
      </div>
    </div>
  )
}
