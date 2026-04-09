'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { criarMotivo, atualizarMotivo, alternarMotivo } from './actions'

type Motivo = {
  id: string
  texto: string
  ordem: number
  ativo: boolean | null
}

const MAX_ATIVOS = 4

export function MotivosClient({ motivos }: { motivos: Motivo[] }) {
  const [modal, setModal] = useState<{
    open: boolean
    editando: Motivo | null
  }>({ open: false, editando: null })
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const totalAtivos = motivos.filter((m) => m.ativo).length
  const limiteAtingido = totalAtivos >= MAX_ATIVOS

  function fechar() {
    setModal({ open: false, editando: null })
    setErro(null)
  }

  async function onSubmit(fd: FormData) {
    setErro(null)
    startTransition(async () => {
      if (modal.editando) fd.append('id', modal.editando.id)
      const action = modal.editando ? atualizarMotivo : criarMotivo
      const res = await action(fd)
      if (res?.error) {
        setErro(res.error)
      } else {
        fechar()
      }
    })
  }

  async function onToggle(m: Motivo) {
    setErro(null)
    startTransition(async () => {
      const res = await alternarMotivo(m.id, !m.ativo)
      if (res?.error) setErro(res.error)
    })
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Motivos</h1>
          <p className="text-sm text-gray-500">
            Opções apresentadas ao cliente quando a nota é baixa (máx.{' '}
            {MAX_ATIVOS} ativas).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs ${
              limiteAtingido ? 'text-amber-600' : 'text-gray-500'
            }`}
          >
            {totalAtivos} / {MAX_ATIVOS} ativas
          </span>
          <button
            type="button"
            disabled={limiteAtingido}
            onClick={() =>
              !limiteAtingido && setModal({ open: true, editando: null })
            }
            title={
              limiteAtingido
                ? 'Desative um motivo antes de criar outro'
                : undefined
            }
            className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Novo motivo
          </button>
        </div>
      </header>

      {erro && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        {motivos.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            Nenhum motivo cadastrado.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {motivos.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-right font-mono text-xs text-gray-400">
                    {m.ordem}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {m.texto}
                    </div>
                    {!m.ativo && (
                      <span className="text-xs text-gray-400">inativo</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setModal({ open: true, editando: m })}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onToggle(m)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    {m.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={modal.open}
        title={modal.editando ? 'Editar motivo' : 'Novo motivo'}
        onClose={fechar}
      >
        <form action={onSubmit} className="space-y-4">
          {erro && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {erro}
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Texto *
            </label>
            <input
              name="texto"
              defaultValue={modal.editando?.texto ?? ''}
              required
              maxLength={80}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Ordem
            </label>
            <input
              name="ordem"
              type="number"
              min={0}
              defaultValue={modal.editando?.ordem ?? 0}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Menor primeiro. Serve apenas como sugestão de exibição ao cliente.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={fechar}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
            >
              {pending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
