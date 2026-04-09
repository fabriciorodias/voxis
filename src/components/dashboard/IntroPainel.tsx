import Link from 'next/link'

/**
 * Caixa introdutória exibida no topo do Painel e de outras telas
 * de relatório. Aparece sempre (não é dismissível) — é leve e
 * reforça o contexto de que o NPS é a métrica central.
 */
export function IntroPainel() {
  return (
    <div className="mb-6 rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-base text-[var(--color-primary)]">
          ℹ
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            Como ler este painel
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-700">
            O número grande em destaque é o <strong>NPS</strong>, que vai de
            −100 a +100 e mede o quanto os clientes recomendariam o
            atendimento. Quanto maior, melhor. Cada ranking permite clicar para
            abrir uma página dedicada com mais detalhes.
          </p>
          <Link
            href="/ajuda"
            className="mt-2 inline-flex text-xs font-medium text-[var(--color-primary)] hover:underline"
          >
            Entender em detalhes e usar o simulador →
          </Link>
        </div>
      </div>
    </div>
  )
}
