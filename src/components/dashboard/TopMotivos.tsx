import Link from 'next/link'
import type { LinhaTopMotivo } from '@/lib/queries'

type Props = {
  dados: LinhaTopMotivo[]
  linkBase?: string // ex: "/painel/motivo"
}

export function TopMotivos({ dados, linkBase }: Props) {
  const max = Math.max(...dados.map((d) => d.count), 1)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        Motivos mais citados
      </h2>
      {dados.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          Nenhum motivo registrado no período.
        </p>
      ) : (
        <div className="space-y-2">
          {dados.map((m) => {
            const corpo = (
              <>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-gray-700 group-hover:text-gray-900">
                    {m.texto}
                  </span>
                  <span className="font-mono text-xs text-gray-500">
                    {m.count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-gray-100">
                  <div
                    className="h-full bg-[var(--color-primary)]"
                    style={{ width: `${(m.count / max) * 100}%` }}
                  />
                </div>
              </>
            )

            if (linkBase) {
              return (
                <Link
                  key={m.id}
                  href={`${linkBase}/${m.id}`}
                  className="group block rounded-md px-1 py-1 -mx-1 transition hover:bg-gray-50"
                >
                  {corpo}
                </Link>
              )
            }
            return (
              <div key={m.id} className="group">
                {corpo}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
