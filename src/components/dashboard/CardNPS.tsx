import type { ResultadoNPS } from '@/lib/nps'
import { COR_CLASSIFICACAO } from '@/lib/nps'
import { InfoIcon } from '@/components/ui/InfoIcon'
import { Tooltip } from '@/components/ui/Tooltip'
import { GLOSSARIO } from '@/lib/glossario'

type Props = {
  titulo: string
  dados: ResultadoNPS & { delta: number | null }
  subtitulo?: string
}

const LABELS_CLASSIFICACAO: Record<string, string> = {
  EXCELENTE: 'Excelente',
  BOM: 'Bom',
  NEUTRO: 'Neutro',
  CRITICO: 'Crítico',
  INSUFICIENTE: 'Dados insuficientes',
}

export function CardNPS({ titulo, dados, subtitulo }: Props) {
  const { nps, classificacao, total, promotores, neutros, detratores, delta } =
    dados
  const cor = COR_CLASSIFICACAO[classificacao]

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase text-gray-500">
        {titulo}
        <InfoIcon content={GLOSSARIO.nps.curto} width="wide" />
      </div>
      {subtitulo && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-400">
          {subtitulo}
          <InfoIcon content={GLOSSARIO.delta.curto} width="wide" />
        </div>
      )}

      <div className="flex items-end gap-3">
        {classificacao === 'INSUFICIENTE' ? (
          <Tooltip content={GLOSSARIO.dadosInsuficientes.curto} width="wide">
            <div className={`cursor-help text-5xl font-bold ${cor}`}>—</div>
          </Tooltip>
        ) : (
          <div className={`text-5xl font-bold ${cor}`}>{nps}</div>
        )}
        {delta !== null && nps !== null && (
          <div
            className={`mb-2 text-sm font-medium ${
              delta > 0
                ? 'text-green-600'
                : delta < 0
                  ? 'text-red-600'
                  : 'text-gray-500'
            }`}
          >
            {delta > 0 ? '↑' : delta < 0 ? '↓' : '='}
            {Math.abs(delta)}
          </div>
        )}
      </div>
      <div className={`mt-1 text-sm font-medium ${cor}`}>
        {LABELS_CLASSIFICACAO[classificacao]}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-xs">
        <div>
          <div className="font-mono text-base text-green-600">{promotores}</div>
          <div className="flex items-center gap-1 text-gray-500">
            Promotores
            <InfoIcon content={GLOSSARIO.promotores.curto} width="medium" />
          </div>
        </div>
        <div>
          <div className="font-mono text-base text-yellow-600">{neutros}</div>
          <div className="flex items-center gap-1 text-gray-500">
            Neutros
            <InfoIcon content={GLOSSARIO.neutros.curto} width="medium" />
          </div>
        </div>
        <div>
          <div className="font-mono text-base text-red-600">{detratores}</div>
          <div className="flex items-center gap-1 text-gray-500">
            Detratores
            <InfoIcon content={GLOSSARIO.detratores.curto} width="medium" />
          </div>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-gray-400">
        Total de {total} {total === 1 ? 'resposta' : 'respostas'}
      </div>
    </div>
  )
}
