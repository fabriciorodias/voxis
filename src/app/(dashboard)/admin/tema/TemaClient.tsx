'use client'

import { useState, useTransition, useMemo } from 'react'
import { PRESETS_BANCO, type PresetBanco } from '@/lib/tema'
import { salvarTema } from './actions'

type Inicial = {
  cor_primaria: string
  cor_secundaria: string
  nome_exibicao: string
  logo_url: string
  preset_banco: string
}

function escurecerCor(hex: string, percent: number): string {
  const clean = hex.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return hex
  const num = parseInt(clean, 16)
  const delta = Math.round((255 * percent) / 100)
  const r = Math.max(0, (num >> 16) - delta)
  const g = Math.max(0, ((num >> 8) & 0xff) - delta)
  const b = Math.max(0, (num & 0xff) - delta)
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

export function TemaClient({ inicial }: { inicial: Inicial }) {
  const [corPrimaria, setCorPrimaria] = useState(inicial.cor_primaria)
  const [corSecundaria, setCorSecundaria] = useState(inicial.cor_secundaria)
  const [nomeExibicao, setNomeExibicao] = useState(inicial.nome_exibicao)
  const [logoUrl, setLogoUrl] = useState(inicial.logo_url)
  const [preset, setPreset] = useState(inicial.preset_banco)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(
    null
  )
  const [pending, startTransition] = useTransition()

  const corPrimariaDark = useMemo(
    () => escurecerCor(corPrimaria, 15),
    [corPrimaria]
  )

  function aplicarPreset(key: string) {
    setPreset(key)
    if (key && key in PRESETS_BANCO) {
      const p = PRESETS_BANCO[key as PresetBanco]
      setCorPrimaria(p.cor_primaria)
      setCorSecundaria(p.cor_secundaria)
    }
  }

  async function onSubmit(fd: FormData) {
    setMsg(null)
    startTransition(async () => {
      const res = await salvarTema(fd)
      if (res?.error) {
        setMsg({ tipo: 'erro', texto: res.error })
      } else {
        setMsg({ tipo: 'ok', texto: 'Tema salvo. Clientes verão a nova identidade nas próximas avaliações.' })
      }
    })
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tema</h1>
        <p className="text-sm text-gray-500">
          Cores, logo e nome que aparecem na página de avaliação do cliente.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulário */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <form action={onSubmit} className="space-y-5">
            {msg && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  msg.tipo === 'ok'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {msg.texto}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Preset de banco
              </label>
              <select
                name="preset_banco"
                value={preset}
                onChange={(e) => aplicarPreset(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="">Personalizado</option>
                {Object.keys(PRESETS_BANCO).map((key) => (
                  <option key={key} value={key}>
                    {key.toUpperCase()}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-400">
                Seleciona as cores padrão do banco. Você pode ajustar depois.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Cor primária
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={corPrimaria}
                    onChange={(e) => {
                      setCorPrimaria(e.target.value)
                      setPreset('')
                    }}
                    className="h-10 w-12 cursor-pointer rounded border border-gray-200"
                  />
                  <input
                    name="cor_primaria"
                    type="text"
                    value={corPrimaria}
                    onChange={(e) => {
                      setCorPrimaria(e.target.value)
                      setPreset('')
                    }}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm uppercase focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Cor secundária
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={corSecundaria}
                    onChange={(e) => {
                      setCorSecundaria(e.target.value)
                      setPreset('')
                    }}
                    className="h-10 w-12 cursor-pointer rounded border border-gray-200"
                  />
                  <input
                    name="cor_secundaria"
                    type="text"
                    value={corSecundaria}
                    onChange={(e) => {
                      setCorSecundaria(e.target.value)
                      setPreset('')
                    }}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm uppercase focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Nome de exibição *
              </label>
              <input
                name="nome_exibicao"
                value={nomeExibicao}
                onChange={(e) => setNomeExibicao(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Aparece no topo da página de avaliação (ex: &quot;Banco Demo&quot;).
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                URL do logo
              </label>
              <input
                name="logo_url"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Cole uma URL HTTPS. Recomendado: PNG transparente, ~200px de altura.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
              >
                {pending ? 'Salvando...' : 'Salvar tema'}
              </button>
            </div>
          </form>
        </section>

        {/* Preview */}
        <section>
          <div className="mb-2 text-xs font-medium uppercase text-gray-400">
            Pré-visualização
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="mx-auto w-full max-w-xs rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 text-center">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={nomeExibicao}
                    className="mx-auto mb-2 h-8 object-contain"
                    onError={(e) =>
                      ((e.currentTarget as HTMLImageElement).style.display =
                        'none')
                    }
                  />
                ) : null}
                <p className="text-[11px] text-gray-500">{nomeExibicao}</p>
              </div>
              <div className="mb-4 text-center">
                <p className="text-xs text-gray-500">Você está avaliando</p>
                <h3 className="mt-0.5 text-lg font-bold text-gray-900">
                  Ana Silva
                </h3>
              </div>
              <p className="mb-3 text-center text-xs text-gray-700">
                Em uma escala de 0 a 10...
              </p>
              <div className="mb-3 grid grid-cols-6 gap-1">
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="flex h-8 items-center justify-center rounded text-xs font-bold text-white"
                    style={{ backgroundColor: '#EF4444' }}
                  >
                    {n}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="w-full rounded-lg py-2 text-xs font-semibold text-white transition"
                style={{ backgroundColor: corPrimaria }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = corPrimariaDark)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = corPrimaria)
                }
              >
                Enviar avaliação
              </button>
              <div
                className="mt-3 text-center text-[10px]"
                style={{ color: corSecundaria }}
              >
                Avaliação 100% anônima
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            A pré-visualização reflete apenas as cores escolhidas. O preview
            muda em tempo real conforme você edita.
          </p>
        </section>
      </div>
    </div>
  )
}
