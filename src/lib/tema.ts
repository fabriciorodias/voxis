export const PRESETS_BANCO = {
  bnb: { cor_primaria: '#006B3F', cor_secundaria: '#FFC107' },
  bb: { cor_primaria: '#FFCC00', cor_secundaria: '#003DA5' },
  basa: { cor_primaria: '#004A9C', cor_secundaria: '#F5A623' },
  caixa: { cor_primaria: '#005CA9', cor_secundaria: '#F26522' },
} as const

export type PresetBanco = keyof typeof PRESETS_BANCO

function escurecerCor(hex: string, percent: number): string {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  const delta = Math.round((255 * percent) / 100)
  const r = Math.max(0, (num >> 16) - delta)
  const g = Math.max(0, ((num >> 8) & 0xff) - delta)
  const b = Math.max(0, (num & 0xff) - delta)
  return (
    '#' +
    [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
  )
}

export function aplicarTema(corPrimaria: string, corSecundaria: string) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--color-primary', corPrimaria)
  root.style.setProperty('--color-secondary', corSecundaria)
  root.style.setProperty('--color-primary-dark', escurecerCor(corPrimaria, 15))
}
