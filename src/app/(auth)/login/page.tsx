import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { login } from './actions'

type Props = {
  searchParams: Promise<{ erro?: string }>
}

const MENSAGENS_ERRO: Record<string, string> = {
  campos: 'Preencha email e senha.',
  credenciais: 'Email ou senha incorretos.',
  sessao: 'Não foi possível iniciar a sessão. Tente novamente.',
  perfil: 'Usuário sem perfil atribuído. Contate o administrador.',
}

export default async function LoginPage({ searchParams }: Props) {
  const { erro } = await searchParams

  // Se já estiver logado, mandar pra tela certa
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: usuario } = await supabase
      .from('usuario')
      .select('perfil')
      .eq('id', user.id)
      .single()
    if (usuario) {
      if (usuario.perfil === 'ADMIN' || usuario.perfil === 'DIRECAO') {
        redirect('/painel')
      }
      if (usuario.perfil === 'GESTOR_AGENCIA') redirect('/agencia')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Voxis</h1>
          <p className="mt-1 text-sm text-gray-500">A voz do cliente na agência</p>
        </div>

        <form
          action={login}
          className="rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Entrar</h2>

          {erro && MENSAGENS_ERRO[erro] && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {MENSAGENS_ERRO[erro]}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)]"
            >
              Entrar
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Acesso restrito a gestores e administradores.
        </p>
      </div>
    </main>
  )
}
