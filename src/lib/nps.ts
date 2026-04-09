export type ClassificacaoNPS =
  | 'EXCELENTE'
  | 'BOM'
  | 'NEUTRO'
  | 'CRITICO'
  | 'INSUFICIENTE'

export type ResultadoNPS = {
  nps: number | null // null = dados insuficientes (< 5 respostas)
  total: number
  promotores: number
  neutros: number
  detratores: number
  classificacao: ClassificacaoNPS
}

export function calcularNPS(notas: number[]): ResultadoNPS {
  const total = notas.length
  if (total < 5) {
    return {
      nps: null,
      total,
      promotores: 0,
      neutros: 0,
      detratores: 0,
      classificacao: 'INSUFICIENTE',
    }
  }

  const promotores = notas.filter((n) => n >= 9).length
  const detratores = notas.filter((n) => n <= 6).length
  const neutros = total - promotores - detratores
  const nps = Math.round((promotores / total) * 100 - (detratores / total) * 100)

  const classificacao: ClassificacaoNPS =
    nps >= 75 ? 'EXCELENTE' : nps >= 50 ? 'BOM' : nps >= 0 ? 'NEUTRO' : 'CRITICO'

  return { nps, total, promotores, neutros, detratores, classificacao }
}

export const COR_CLASSIFICACAO: Record<ClassificacaoNPS, string> = {
  EXCELENTE: 'text-green-600',
  BOM: 'text-blue-600',
  NEUTRO: 'text-yellow-600',
  CRITICO: 'text-red-600',
  INSUFICIENTE: 'text-gray-400',
}
