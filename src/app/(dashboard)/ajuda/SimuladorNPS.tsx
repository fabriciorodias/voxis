'use client'

import { useState } from 'react'
import { calcularNPS, COR_CLASSIFICACAO } from '@/lib/nps'

const LABELS_CLASSIFICACAO: Record<string, string> = {
  EXCELENTE: 'Excelente',
  BOM: 'Bom',
  NEUTRO: 'Neutro',
  CRITICO: 'Crítico',
  INSUFICIENTE: 'Dados insuficientes',
}

function corNota(n: number): string {
  if (n <= 6) return 'bg-red-500 hover:bg-red-600'
  if (n <= 8) return 'bg-amber-500 hover:bg-amber-600'
  return 'bg-green-500 hover:bg-green-600'
}

/**
 * Simulador interativo: usuário clica nas notas pra adicionar respostas,
 * o NPS se atualiza em tempo real com explicação da fórmula.
 */
export function SimuladorNPS() {
  const [notas, setNotas] = useState<number[]>([])

  function adicionar(n: number) {
    setNotas((prev) => [...prev, n])
  }

  function limpar() {
    setNotas([])
  }

  function removerUltima() {
    setNotas((prev) => prev.slice(0, -1))
  }

  function precarregar(cenario: 'promotor' | 'neutro' | 'critico' | 'insuficiente') {
    const cenarios: Record<string, number[]> = {
      promotor: [10, 10, 9, 10, 9, 10, 8, 10, 9, 10],
      neutro: [8, 7, 9, 6, 8, 7, 9, 8, 10, 5],
      critico: [3, 5, 4, 6, 5, 7, 3, 4, 2, 8],
      insuficiente: [9, 10, 8],
    }
    setNotas(cenarios[cenario])
  }

  const resultado = calcularNPS(notas)
  const cor = COR_CLASSIFICACAO[resultado.classificacao]

  const pctP =
    resultado.total > 0
      ? Math.round((resultado.promotores / resultado.total) * 100)
      : 0
  const pctD =
    resultado.total > 0
      ? Math.round((resultado.detratores / resultado.total) * 100)
      : 0

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        Simulador de NPS
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Clique nas notas abaixo para adicionar respostas e veja o NPS sendo
        recalculado em tempo real.
      </p>

      {/* Escala */}
      <div className="mt-5">
        <div className="grid grid-cols-11 gap-1.5">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => adicionar(n)}
              className={`${corNota(
                n
              )} flex h-10 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm transition active:scale-95`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 flex justify-between px-1 text-[11px] text-gray-500">
          <span>Nada provável</span>
          <span>Muito provável</span>
        </div>
      </div>

      {/* Atalhos */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => precarregar('promotor')}
          className="rounded-lg border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
        >
          Cenário: ótimo
        </button>
        <button
          type="button"
          onClick={() => precarregar('neutro')}
          className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-100"
        >
          Cenário: neutro
        </button>
        <button
          type="button"
          onClick={() => precarregar('critico')}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
        >
          Cenário: crítico
        </button>
        <button
          type="button"
          onClick={() => precarregar('insuficiente')}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          Cenário: poucos dados
        </button>
        <div className="flex-1" />
        <button
          type="button"
          disabled={notas.length === 0}
          onClick={removerUltima}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Remover última
        </button>
        <button
          type="button"
          disabled={notas.length === 0}
          onClick={limpar}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Limpar
        </button>
      </div>

      {/* Notas adicionadas */}
      <div className="mt-5 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3">
        <div className="text-xs font-medium text-gray-500">
          Notas adicionadas ({notas.length})
        </div>
        {notas.length === 0 ? (
          <div className="mt-2 text-xs text-gray-400">
            Nenhuma nota ainda — clique em um número acima.
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1">
            {notas.map((n, i) => (
              <span
                key={i}
                className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white ${corNota(
                  n
                )}`}
              >
                {n}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Resultado */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-gray-500">
            NPS calculado
          </div>
          <div className={`mt-1 text-5xl font-bold ${cor}`}>
            {resultado.nps === null ? '—' : resultado.nps}
          </div>
          <div className={`mt-1 text-sm font-medium ${cor}`}>
            {LABELS_CLASSIFICACAO[resultado.classificacao]}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-xs">
            <div>
              <div className="font-mono text-base text-green-600">
                {resultado.promotores}
              </div>
              <div className="text-gray-500">Promotores</div>
            </div>
            <div>
              <div className="font-mono text-base text-yellow-600">
                {resultado.neutros}
              </div>
              <div className="text-gray-500">Neutros</div>
            </div>
            <div>
              <div className="font-mono text-base text-red-600">
                {resultado.detratores}
              </div>
              <div className="text-gray-500">Detratores</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium uppercase text-gray-500">
            Como esse número apareceu
          </div>
          {resultado.nps === null ? (
            <p className="mt-3 text-sm text-gray-600">
              Com menos de 5 respostas, o NPS é considerado estatisticamente
              frágil e é exibido como <strong className="font-mono">—</strong>.
              Adicione mais notas pra continuar.
            </p>
          ) : (
            <div className="mt-3 space-y-2 text-xs text-gray-600">
              <div>
                <span className="font-mono">% Promotores</span> ={' '}
                <span className="font-mono">
                  {resultado.promotores} ÷ {resultado.total} × 100
                </span>{' '}
                = <span className="font-mono font-semibold">{pctP}%</span>
              </div>
              <div>
                <span className="font-mono">% Detratores</span> ={' '}
                <span className="font-mono">
                  {resultado.detratores} ÷ {resultado.total} × 100
                </span>{' '}
                = <span className="font-mono font-semibold">{pctD}%</span>
              </div>
              <div className="border-t border-gray-100 pt-2">
                <span className="font-mono">NPS</span> ={' '}
                <span className="font-mono">
                  {pctP}% − {pctD}%
                </span>{' '}
                ={' '}
                <span className={`font-mono text-base font-bold ${cor}`}>
                  {resultado.nps}
                </span>
              </div>
              <p className="pt-1 text-[11px] text-gray-400">
                Observação: os neutros (notas 7 e 8) não entram na fórmula —
                são ignorados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
