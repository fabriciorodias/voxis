'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { PerfilUsuario } from '@/lib/auth'
import {
  criarUsuario,
  atualizarUsuario,
  alternarUsuario,
  resetarSenhaUsuario,
} from './actions'

type Usuario = {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  agencia_id: string | null
  ativo: boolean | null
}

type Agencia = {
  id: string
  nome: string
  codigo: string
  ativo: boolean | null
}

type Props = {
  usuarios: Usuario[]
  agencias: Agencia[]
  meuId: string
}

type ModalState =
  | { tipo: 'novo' }
  | { tipo: 'editar'; u: Usuario }
  | { tipo: 'senha'; email: string; senha: string }
  | null

const LABELS_PERFIL: Record<PerfilUsuario, string> = {
  ADMIN: 'Administrador',
  DIRECAO: 'Direção',
  GESTOR_AGENCIA: 'Gestor de agência',
}

export function UsuariosClient({ usuarios, agencias, meuId }: Props) {
  const [modal, setModal] = useState<ModalState>(null)
  const [perfilSelecionado, setPerfilSelecionado] =
    useState<PerfilUsuario>('DIRECAO')
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const mapaAgencias = new Map(agencias.map((a) => [a.id, a]))
  const agenciasAtivas = agencias.filter((a) => a.ativo)

  function fechar() {
    setModal(null)
    setErro(null)
  }

  function abrirNovo() {
    setPerfilSelecionado('DIRECAO')
    setModal({ tipo: 'novo' })
    setErro(null)
  }

  function abrirEditar(u: Usuario) {
    setPerfilSelecionado(u.perfil)
    setModal({ tipo: 'editar', u })
    setErro(null)
  }

  async function onSubmit(fd: FormData) {
    setErro(null)
    startTransition(async () => {
      if (modal?.tipo === 'editar') {
        fd.append('id', modal.u.id)
        const res = await atualizarUsuario(fd)
        if (res?.error) setErro(res.error)
        else fechar()
      } else {
        const res = await criarUsuario(fd)
        if (res?.error) {
          setErro(res.error)
        } else if (res?.ok && res.senha) {
          // Mostrar a senha gerada/escolhida pro admin copiar
          setModal({ tipo: 'senha', email: res.email, senha: res.senha })
        }
      }
    })
  }

  async function onToggle(u: Usuario) {
    setErro(null)
    startTransition(async () => {
      const res = await alternarUsuario(u.id, !u.ativo)
      if (res?.error) setErro(res.error)
    })
  }

  async function onResetSenha(u: Usuario) {
    setErro(null)
    startTransition(async () => {
      const res = await resetarSenhaUsuario(u.id)
      if (res?.error) {
        setErro(res.error)
      } else if (res?.ok && res.senha) {
        setModal({ tipo: 'senha', email: res.email, senha: res.senha })
      }
    })
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500">
            Controle de acesso da direção e gestores de agência.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)]"
        >
          + Novo usuário
        </button>
      </header>

      {erro && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        {usuarios.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            Nenhum usuário cadastrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                  <th className="pb-2 pr-4 font-medium">Nome</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Perfil</th>
                  <th className="pb-2 pr-4 font-medium">Agência</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((u) => {
                  const ag = u.agencia_id
                    ? mapaAgencias.get(u.agencia_id)
                    : null
                  const ehEu = u.id === meuId
                  return (
                    <tr key={u.id}>
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {u.nome}
                        {ehEu && (
                          <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] uppercase text-blue-600">
                            você
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{u.email}</td>
                      <td className="py-3 pr-4 text-gray-600">
                        {LABELS_PERFIL[u.perfil]}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {ag ? `${ag.codigo} · ${ag.nome}` : '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                            u.ativo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 text-right text-xs">
                        <button
                          type="button"
                          onClick={() => abrirEditar(u)}
                          className="mr-2 text-gray-500 hover:text-gray-900"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => onResetSenha(u)}
                          className="mr-2 text-gray-500 hover:text-gray-900"
                        >
                          Nova senha
                        </button>
                        <button
                          type="button"
                          disabled={pending || (ehEu && !!u.ativo)}
                          title={
                            ehEu && u.ativo
                              ? 'Você não pode se desativar'
                              : undefined
                          }
                          onClick={() => onToggle(u)}
                          className="text-gray-500 hover:text-gray-900 disabled:opacity-40"
                        >
                          {u.ativo ? 'Desativar' : 'Ativar'}
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
        title={modal?.tipo === 'editar' ? 'Editar usuário' : 'Novo usuário'}
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
              Nome *
            </label>
            <input
              name="nome"
              required
              defaultValue={modal?.tipo === 'editar' ? modal.u.nome : ''}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {modal?.tipo === 'novo' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Email *
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Perfil *
            </label>
            <select
              name="perfil"
              value={perfilSelecionado}
              onChange={(e) =>
                setPerfilSelecionado(e.target.value as PerfilUsuario)
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="ADMIN">{LABELS_PERFIL.ADMIN}</option>
              <option value="DIRECAO">{LABELS_PERFIL.DIRECAO}</option>
              <option value="GESTOR_AGENCIA">
                {LABELS_PERFIL.GESTOR_AGENCIA}
              </option>
            </select>
          </div>

          {perfilSelecionado === 'GESTOR_AGENCIA' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Agência *
              </label>
              <select
                name="agencia_id"
                required
                defaultValue={
                  modal?.tipo === 'editar' ? modal.u.agencia_id ?? '' : ''
                }
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

          {modal?.tipo === 'novo' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Senha inicial
              </label>
              <input
                name="senha"
                type="text"
                minLength={8}
                placeholder="Deixe vazio para gerar automaticamente"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm focus:border-[var(--color-primary)] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Mínimo 8 caracteres. A senha é mostrada uma única vez após a
                criação.
              </p>
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

      {/* Modal Senha gerada */}
      <Modal
        open={modal?.tipo === 'senha'}
        title="Credenciais do usuário"
        onClose={fechar}
      >
        {modal?.tipo === 'senha' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              Copie e guarde estas credenciais agora. Elas não serão mostradas
              novamente.
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700">Email</div>
              <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm">
                {modal.email}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700">Senha</div>
              <div className="mt-1 flex gap-2">
                <input
                  readOnly
                  value={modal.senha}
                  className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(modal.senha)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Copiar
                </button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={fechar}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)]"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
