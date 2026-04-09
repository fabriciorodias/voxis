'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import {
  criarAgencia,
  atualizarAgencia,
  alternarAgencia,
  criarSuperintendencia,
  atualizarSuperintendencia,
  alternarSuperintendencia,
} from './actions'

type Superintendencia = {
  id: string
  nome: string
  codigo: string | null
  ativo: boolean | null
}

type Agencia = {
  id: string
  nome: string
  codigo: string
  municipio: string | null
  uf: string | null
  ativo: boolean | null
  superintendencia_id: string | null
}

type Props = {
  superintendencias: Superintendencia[]
  agencias: Agencia[]
}

export function AgenciasClient({ superintendencias, agencias }: Props) {
  const [modalAgencia, setModalAgencia] = useState<{
    open: boolean
    editando: Agencia | null
  }>({ open: false, editando: null })
  const [modalSup, setModalSup] = useState<{
    open: boolean
    editando: Superintendencia | null
  }>({ open: false, editando: null })
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function mapaSup(id: string | null) {
    if (!id) return null
    return superintendencias.find((s) => s.id === id) ?? null
  }

  async function onSubmitAgencia(fd: FormData) {
    setErro(null)
    startTransition(async () => {
      const action = modalAgencia.editando ? atualizarAgencia : criarAgencia
      if (modalAgencia.editando) fd.append('id', modalAgencia.editando.id)
      const res = await action(fd)
      if (res?.error) {
        setErro(res.error)
      } else {
        setModalAgencia({ open: false, editando: null })
      }
    })
  }

  async function onSubmitSup(fd: FormData) {
    setErro(null)
    startTransition(async () => {
      const action = modalSup.editando
        ? atualizarSuperintendencia
        : criarSuperintendencia
      if (modalSup.editando) fd.append('id', modalSup.editando.id)
      const res = await action(fd)
      if (res?.error) {
        setErro(res.error)
      } else {
        setModalSup({ open: false, editando: null })
      }
    })
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agências</h1>
        <p className="text-sm text-gray-500">
          Gerencie a rede de agências e suas superintendências.
        </p>
      </header>

      {/* Superintendências */}
      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Superintendências
            </h2>
            <p className="text-xs text-gray-500">
              Opcional. Usado para agrupar agências na visão da direção.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalSup({ open: true, editando: null })}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            + Nova
          </button>
        </div>

        {superintendencias.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            Nenhuma superintendência cadastrada.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {superintendencias.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {s.nome}
                    {s.codigo && (
                      <span className="ml-2 text-xs text-gray-400">
                        ({s.codigo})
                      </span>
                    )}
                  </div>
                  {!s.ativo && (
                    <span className="text-xs text-gray-400">inativa</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalSup({ open: true, editando: s })}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(() =>
                        alternarSuperintendencia(s.id, !s.ativo).then(() => {})
                      )
                    }
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    {s.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Agências */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Agências</h2>
          <button
            type="button"
            onClick={() => setModalAgencia({ open: true, editando: null })}
            className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)]"
          >
            + Nova agência
          </button>
        </div>

        {agencias.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            Nenhuma agência cadastrada.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                  <th className="pb-2 pr-4 font-medium">Código</th>
                  <th className="pb-2 pr-4 font-medium">Nome</th>
                  <th className="pb-2 pr-4 font-medium">Cidade / UF</th>
                  <th className="pb-2 pr-4 font-medium">Superintendência</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agencias.map((a) => {
                  const sup = mapaSup(a.superintendencia_id)
                  return (
                    <tr key={a.id}>
                      <td className="py-3 pr-4 font-mono text-xs text-gray-500">
                        {a.codigo}
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {a.nome}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {a.municipio ? `${a.municipio}${a.uf ? ` / ${a.uf}` : ''}` : '—'}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {sup?.nome ?? '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                            a.ativo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {a.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="py-3 text-right text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setModalAgencia({ open: true, editando: a })
                          }
                          className="mr-2 text-gray-500 hover:text-gray-900"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(() =>
                              alternarAgencia(a.id, !a.ativo).then(() => {})
                            )
                          }
                          className="text-gray-500 hover:text-gray-900"
                        >
                          {a.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Agência */}
      <Modal
        open={modalAgencia.open}
        title={modalAgencia.editando ? 'Editar agência' : 'Nova agência'}
        onClose={() => setModalAgencia({ open: false, editando: null })}
      >
        <form action={onSubmitAgencia} className="space-y-4">
          {erro && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {erro}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Código *
              </label>
              <input
                name="codigo"
                defaultValue={modalAgencia.editando?.codigo ?? ''}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                UF
              </label>
              <input
                name="uf"
                maxLength={2}
                defaultValue={modalAgencia.editando?.uf ?? ''}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Nome *
            </label>
            <input
              name="nome"
              defaultValue={modalAgencia.editando?.nome ?? ''}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Município
            </label>
            <input
              name="municipio"
              defaultValue={modalAgencia.editando?.municipio ?? ''}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Superintendência
            </label>
            <select
              name="superintendencia_id"
              defaultValue={modalAgencia.editando?.superintendencia_id ?? ''}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="">—</option>
              {superintendencias
                .filter((s) => s.ativo)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalAgencia({ open: false, editando: null })}
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

      {/* Modal Superintendência */}
      <Modal
        open={modalSup.open}
        title={
          modalSup.editando ? 'Editar superintendência' : 'Nova superintendência'
        }
        onClose={() => setModalSup({ open: false, editando: null })}
      >
        <form action={onSubmitSup} className="space-y-4">
          {erro && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {erro}
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Nome *
            </label>
            <input
              name="nome"
              defaultValue={modalSup.editando?.nome ?? ''}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Código
            </label>
            <input
              name="codigo"
              defaultValue={modalSup.editando?.codigo ?? ''}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalSup({ open: false, editando: null })}
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
