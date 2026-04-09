'use client'

import { useEffect, useState } from 'react'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { EscalaNPS } from '@/components/avaliacao/EscalaNPS'
import { SelecaoMotivo, type OpcaoMotivo } from '@/components/avaliacao/SelecaoMotivo'
import { Agradecimento } from '@/components/avaliacao/Agradecimento'
import { aplicarTema } from '@/lib/tema'

type Estado =
  | 'carregando'
  | 'bloqueado'
  | 'nota'
  | 'motivo'
  | 'enviando'
  | 'concluido'
  | 'erro'

type Props = {
  gr: { id: string; nome: string }
  agencia: { nome: string; codigo: string } | null
  tema: {
    corPrimaria: string
    corSecundaria: string
    nomeExibicao: string
    logoUrl: string | null
  }
  opcoesMotivo: OpcaoMotivo[]
}

export function AvaliacaoCliente({ gr, agencia, tema, opcoesMotivo }: Props) {
  const [estado, setEstado] = useState<Estado>('carregando')
  const [deviceHash, setDeviceHash] = useState<string | null>(null)
  const [nota, setNota] = useState<number | null>(null)
  const [erroMsg, setErroMsg] = useState<string>('')

  // Aplicar tema
  useEffect(() => {
    aplicarTema(tema.corPrimaria, tema.corSecundaria)
  }, [tema.corPrimaria, tema.corSecundaria])

  // Calcular fingerprint e checar rate limit
  useEffect(() => {
    let cancelado = false
    ;(async () => {
      try {
        const fp = await FingerprintJS.load()
        const resultado = await fp.get()
        if (cancelado) return
        const hash = resultado.visitorId
        setDeviceHash(hash)

        const resp = await fetch('/api/avaliar/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gr_id: gr.id, device_hash: hash }),
        })
        const data = await resp.json()
        if (cancelado) return
        if (!data.permitido) {
          setEstado('bloqueado')
        } else {
          setEstado('nota')
        }
      } catch (err) {
        console.error('[AvaliacaoCliente] erro no carregamento:', err)
        if (!cancelado) {
          setEstado('erro')
          setErroMsg('Não foi possível carregar. Tente novamente.')
        }
      }
    })()
    return () => {
      cancelado = true
    }
  }, [gr.id])

  function handleSelecionarNota(n: number) {
    setNota(n)
    if (n >= 9) {
      // Nota alta não pede motivo — envia direto
      enviarAvaliacao(n, [], null)
    } else {
      setEstado('motivo')
    }
  }

  async function enviarAvaliacao(
    notaFinal: number,
    motivos: string[],
    motivoOutro: string | null
  ) {
    if (!deviceHash) return
    setEstado('enviando')
    try {
      const resp = await fetch('/api/avaliar/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gr_id: gr.id,
          nota: notaFinal,
          device_hash: deviceHash,
          motivos,
          motivo_outro: motivoOutro ?? undefined,
        }),
      })

      if (resp.status === 429) {
        setEstado('bloqueado')
        return
      }
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erro no envio')
      }

      setEstado('concluido')
    } catch (err) {
      console.error('[AvaliacaoCliente] erro no envio:', err)
      setEstado('erro')
      setErroMsg(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  function handleSubmitMotivo(motivos: string[], motivoOutro: string | null) {
    if (nota === null) return
    enviarAvaliacao(nota, motivos, motivoOutro)
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <header className="mb-6 text-center">
          {tema.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tema.logoUrl}
              alt={tema.nomeExibicao}
              className="mx-auto mb-3 h-10 object-contain"
            />
          )}
          <p className="text-sm text-gray-500">{tema.nomeExibicao}</p>
        </header>

        {/* Card principal */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          {estado === 'carregando' && (
            <div className="flex flex-col items-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--color-primary)]" />
              <p className="mt-4 text-sm text-gray-500">Carregando...</p>
            </div>
          )}

          {estado === 'bloqueado' && (
            <div className="py-8 text-center">
              <h2 className="mb-2 text-xl font-bold text-gray-900">
                Avaliação já registrada
              </h2>
              <p className="text-sm text-gray-600">
                Você já avaliou este gerente nas últimas 24 horas. Obrigado!
              </p>
            </div>
          )}

          {estado === 'erro' && (
            <div className="py-8 text-center">
              <h2 className="mb-2 text-xl font-bold text-red-600">Ops!</h2>
              <p className="text-sm text-gray-600">{erroMsg}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-semibold text-white"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {(estado === 'nota' || estado === 'motivo' || estado === 'enviando') && (
            <>
              <div className="mb-6 text-center">
                <p className="text-sm text-gray-500">Você está avaliando</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">
                  {gr.nome}
                </h1>
                {agencia && (
                  <p className="mt-1 text-sm text-gray-500">
                    {agencia.nome} ({agencia.codigo})
                  </p>
                )}
              </div>

              {estado === 'nota' && (
                <>
                  <p className="mb-4 text-center text-base text-gray-700">
                    Em uma escala de 0 a 10, o quanto você recomendaria este
                    gerente a um amigo?
                  </p>
                  <EscalaNPS onSelect={handleSelecionarNota} />
                </>
              )}

              {estado === 'motivo' && (
                <SelecaoMotivo
                  opcoes={opcoesMotivo}
                  onSubmit={handleSubmitMotivo}
                />
              )}

              {estado === 'enviando' && (
                <div className="flex flex-col items-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--color-primary)]" />
                  <p className="mt-4 text-sm text-gray-500">Enviando...</p>
                </div>
              )}
            </>
          )}

          {estado === 'concluido' && <Agradecimento />}
        </div>

        <footer className="mt-6 text-center text-xs text-gray-400">
          Voxis · Avaliação 100% anônima
        </footer>
      </div>
    </main>
  )
}
