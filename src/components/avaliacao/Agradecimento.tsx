'use client'

export function Agradecimento() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <svg
          className="h-10 w-10 text-green-600"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Obrigado!</h2>
      <p className="max-w-xs text-base text-gray-600">
        Sua avaliação foi registrada e é 100% anônima.
      </p>
    </div>
  )
}
