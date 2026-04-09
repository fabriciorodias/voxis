import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '../(auth)/login/actions'

type ItemNav = {
  href: string
  label: string
  perfis: Array<'ADMIN' | 'DIRECAO' | 'GESTOR_AGENCIA'>
}

const NAV: ItemNav[] = [
  { href: '/admin/agencias', label: 'Agências', perfis: ['ADMIN'] },
  { href: '/admin/gerentes', label: 'Gerentes', perfis: ['ADMIN'] },
  { href: '/admin/motivos', label: 'Motivos', perfis: ['ADMIN'] },
  { href: '/admin/tema', label: 'Tema', perfis: ['ADMIN'] },
  { href: '/admin/usuarios', label: 'Usuários', perfis: ['ADMIN'] },
  { href: '/direcao', label: 'Direção', perfis: ['ADMIN', 'DIRECAO'] },
  {
    href: '/agencia',
    label: 'Minha agência',
    perfis: ['ADMIN', 'DIRECAO', 'GESTOR_AGENCIA'],
  },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuario')
    .select('nome, perfil')
    .eq('id', user.id)
    .single()

  if (!usuario) redirect('/login')

  const perfil = usuario.perfil as 'ADMIN' | 'DIRECAO' | 'GESTOR_AGENCIA'
  const itensVisiveis = NAV.filter((i) => i.perfis.includes(perfil))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold text-gray-900">
              Voxis
            </Link>
            <nav className="hidden gap-4 md:flex">
              {itensVisiveis.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <div className="font-medium text-gray-900">{usuario.nome}</div>
              <div className="text-gray-500">{perfil}</div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
        {/* Nav mobile */}
        <nav className="flex gap-4 overflow-x-auto border-t border-gray-100 px-4 py-2 md:hidden">
          {itensVisiveis.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 text-sm text-gray-600 hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
