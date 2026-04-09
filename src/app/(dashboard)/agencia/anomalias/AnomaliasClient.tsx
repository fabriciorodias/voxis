'use client'

import { useState, useTransition } from 'react'
import type { LinhaAnomalia } from '@/lib/queries'
import { aprovarAnomalia, rejeitarAnomalia } from './actions'

type AnomaliaComContagem = LinhaAnomalia & { avaliacoes_afetadas: number }

const LABELS_TIPO: Record<string, string> = {
  RAJADA_10MIN: 'Rajada de respostas (10min)',
}

export function AnomaliasClient({
  anomalias,
}: {
  anomalias: AnomaliaComContagem[]
}) {
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onAprovar(id: string) {
    setErro(null)
    startTransition(async () => {
      const res = await aprovarAnomalia(id)
      if (res?.error) setErro(res.error)
    })
  }

  function onRejeitar(id: string) {
    setErro(null)
    startTransition(async () => {
      const res = await rejeitarAnomalia(id)
      if (res?.error) setErro(res.error)
    })
  }

  function formatarData(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Anomalias</h1>
        <p className="text-sm text-gray-500">
          Avaliações em quarentena que precisam de revisão manual.
        </p>
      </header>

      {erro && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {anomalias.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <div className="mb-2 text-4xl">✓</div>
          <p className="text-sm text-gray-500">
            Nenhuma anomalia aberta. Tudo limpo!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {anomalias.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1 text-xs font-semibold uppercase text-amber-700">
                    {LABELS_TIPO[a.tipo_anomalia] ?? a.tipo_anomalia}
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    {a.gr_nome ?? 'Gerente desconhecido'}
                    {a.agencia_codigo && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        {a.agencia_codigo} · {a.agencia_nome}
                      </span>
                    )}
                  </div>
                  {a.descricao && (
                    <p className="mt-1 text-sm text-gray-700">{a.descricao}</p>
                  )}
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>
                      Detectado em {formatarData(a.detectado_em)}
                    </span>
                    <span>
                      <strong className="text-amber-800">
                        {a.avaliacoes_afetadas}
                      </strong>{' '}
                      {a.avaliacoes_afetadas === 1
                        ? 'avaliação em quarentena'
                        : 'avaliações em quarentena'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onRejeitar(a.id)}
                    className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    title="Descartar as avaliações suspeitas"
                  >
                    Rejeitar
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onAprovar(a.id)}
                    className="rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                    title="Aceitar as avaliações como legítimas"
                  >
                    Aprovar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl bg-gray-50 p-4 text-xs text-gray-600">
        <p className="font-semibold">O que significa cada decisão:</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <strong>Aprovar</strong>: as avaliações são consideradas legítimas e
            entram no cálculo do NPS.
          </li>
          <li>
            <strong>Rejeitar</strong>: as avaliações são descartadas do NPS (mas
            permanecem no histórico com status REJEITADA).
          </li>
        </ul>
      </div>
    </div>
  )
}
