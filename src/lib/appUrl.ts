/**
 * URL pública da instância, usada para gerar o link do QR Code dos GRs.
 *
 * Ordem de resolução:
 * 1. `NEXT_PUBLIC_APP_URL` — override explícito (domínio customizado)
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — URL estável do projeto em produção
 *    fornecida automaticamente pelo Vercel (ex.: voxis.vercel.app)
 * 3. `VERCEL_URL` — URL do deployment atual (preview/branch)
 * 4. `http://localhost:3000` — fallback pra dev local
 */
export function getAppUrl(): string {
  const override = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (override) return override.replace(/\/$/, '')

  const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (prodUrl) return `https://${prodUrl}`

  const deployUrl = process.env.VERCEL_URL?.trim()
  if (deployUrl) return `https://${deployUrl}`

  return 'http://localhost:3000'
}
