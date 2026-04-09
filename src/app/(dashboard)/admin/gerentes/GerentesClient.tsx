'use client'

import { useState, useTransition, useEffect } from 'react'
import QRCode from 'qrcode'
import { Modal } from '@/components/ui/Modal'
import {
  criarGerente,
  atualizarGerente,
  alternarGerente,
  transferirGerente,
} from './actions'

type Gerente = {
  id: string
  nome: string
  matricula: string | null
  qr_token: string
  ativo: boolean | null
  agencia_id: string
  ativo_desde: string | null
}

type Agencia = {
  id: string
  nome: string
  codigo: string
  ativo: boolean | null
}

type Props = {
  gerentes: Gerente[]
  agencias: Agencia[]
  appUrl: string
}

type ModalEstado =
  | { tipo: 'novo' }
  | { tipo: 'editar'; gr: Gerente }
  | { tipo: 'qr'; gr: Gerente }
  | { tipo: 'transferir'; gr: Gerente }
  | null

export function GerentesClient({ gerentes, agencias, appUrl }: Props) {
  const [modal, setModal] = useState<ModalEstado>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const mapaAgencia = new Map(agencias.map((a) => [a.id, a]))
  const agenciasAtivas = agencias.filter((a) => a.ativo)

  function fechar() {
    setModal(null)
    setErro(null)
  }

  async function onSubmitGerente(fd: FormData) {
    setErro(null)
    startTransition(async () => {
      if (modal?.tipo === 'editar') fd.append('id', modal.gr.id)
      const action =
        modal?.tipo === 'editar' ? atualizarGerente : criarGerente
      const res = await action(fd)
      if (res?.error) {
        setErro(res.error)
      } else {
        fechar()
      }
    })
  }

  async function onSubmitTransferir(fd: FormData) {
    if (modal?.tipo !== 'transferir') return
    setErro(null)
    startTransition(async () => {
      fd.append('gr_id', modal.gr.id)
      const res = await transferirGerente(fd)
      if (res?.error) {
        setErro(res.error)
      } else {
        fechar()
      }
    })
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerentes</h1>
          <p className="text-sm text-gray-500">
            Cadastre GRs e gere QR Codes de avaliação.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ tipo: 'novo' })}
          className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)]"
        >
          + Novo gerente
        </button>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        {gerentes.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            Nenhum gerente cadastrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                  <th className="pb-2 pr-4 font-medium">Nome</th>
                  <th className="pb-2 pr-4 font-medium">Matrícula</th>
                  <th className="pb-2 pr-4 font-medium">Agência</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gerentes.map((g) => {
                  const ag = mapaAgencia.get(g.agencia_id)
                  return (
                    <tr key={g.id}>
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {g.nome}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-gray-500">
                        {g.matricula ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {ag ? `${ag.codigo} · ${ag.nome}` : '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                            g.ativo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {g.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 text-right text-xs">
                        <button
                          type="button"
                          onClick={() => setModal({ tipo: 'qr', gr: g })}
                          className="mr-2 text-gray-500 hover:text-gray-900"
                        >
                          QR
                        </button>
                        <button
                          type="button"
                          onClick={() => setModal({ tipo: 'editar', gr: g })}
                          className="mr-2 text-gray-500 hover:text-gray-900"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setModal({ tipo: 'transferir', gr: g })
                          }
                          className="mr-2 text-gray-500 hover:text-gray-900"
                        >
                          Transferir
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(() =>
                              alternarGerente(g.id, !g.ativo).then(() => {})
                            )
                          }
                          className="text-gray-500 hover:text-gray-900"
                        >
                          {g.ativo ? 'Desativar' : 'Ativar'}
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

      {/* Modal Novo / Editar */}
      <Modal
        open={modal?.tipo === 'novo' || modal?.tipo === 'editar'}
        title={
          modal?.tipo === 'editar' ? 'Editar gerente' : 'Novo gerente'
        }
        onClose={fechar}
      >
        <form action={onSubmitGerente} className="space-y-4">
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
              defaultValue={
                modal?.tipo === 'editar' ? modal.gr.nome : ''
              }
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Matrícula
            </label>
            <input
              name="matricula"
              defaultValue={
                modal?.tipo === 'editar' ? modal.gr.matricula ?? '' : ''
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          {modal?.tipo === 'novo' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Agência inicial *
              </label>
              <select
                name="agencia_id"
                required
                defaultValue=""
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {agenciasAtivas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.codigo} · {a.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
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

      {/* Modal QR Code */}
      <Modal
        open={modal?.tipo === 'qr'}
        title="QR Code de avaliação"
        onClose={fechar}
      >
        {modal?.tipo === 'qr' && (
          <QRCodePainel gr={modal.gr} appUrl={appUrl} />
        )}
      </Modal>

      {/* Modal Transferir */}
      <Modal
        open={modal?.tipo === 'transferir'}
        title="Transferir gerente"
        onClose={fechar}
      >
        {modal?.tipo === 'transferir' && (
          <form action={onSubmitTransferir} className="space-y-4">
            {erro && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {erro}
              </div>
            )}
            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              <div>
                <strong>{modal.gr.nome}</strong>
              </div>
              <div>
                Atualmente em:{' '}
                {mapaAgencia.get(modal.gr.agencia_id)?.nome ?? '—'}
              </div>
              <div className="mt-2 text-[11px] text-gray-500">
                O QR Code é preservado — o mesmo link continua funcionando na
                nova agência.
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Nova agência *
              </label>
              <select
                name="nova_agencia_id"
                required
                defaultValue=""
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {agenciasAtivas
                  .filter((a) => a.id !== modal.gr.agencia_id)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.codigo} · {a.nome}
                    </option>
                  ))}
              </select>
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
                {pending ? 'Transferindo...' : 'Transferir'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

// ---------- QRCodePainel ----------

function QRCodePainel({ gr, appUrl }: { gr: Gerente; appUrl: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const url = `${appUrl}/avaliar/${gr.qr_token}`

  useEffect(() => {
    QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      width: 512,
      margin: 2,
    })
      .then(setDataUrl)
      .catch(console.error)
  }, [url])

  function baixar() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `voxis-qr-${gr.nome.toLowerCase().replace(/\s+/g, '-')}.png`
    a.click()
  }

  function copiar() {
    navigator.clipboard.writeText(url)
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900">{gr.nome}</div>
        <div className="mt-2 break-all text-xs text-gray-500">{url}</div>
      </div>

      <div className="flex items-center justify-center rounded-xl bg-gray-50 p-4">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={`QR code de ${gr.nome}`}
            className="h-64 w-64"
          />
        ) : (
          <div className="h-64 w-64 animate-pulse rounded-lg bg-gray-200" />
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={copiar}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Copiar link
        </button>
        <button
          type="button"
          onClick={baixar}
          disabled={!dataUrl}
          className="flex-1 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
        >
          Baixar PNG
        </button>
      </div>
    </div>
  )
}
