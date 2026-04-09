import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '../(auth)/login/actions'
import { GrupoDropdown } from '@/components/nav/GrupoDropdown'

type PerfilNav = 'ADMIN' | 'DIRECAO' | 'GESTOR_AGENCIA'

type ItemNav = {
  href: string
  label: string
  perfis: PerfilNav[]
}

type GrupoNav = {
  label: string
  href?: string
  perfis: PerfilNav[]
  itens?: ItemNav[]
}

const NAV: GrupoNav[] = [
  {
    label: 'Painel',
    href: '/painel',
    perfis: ['ADMIN', 'DIRECAO'],
  },
  {
    label: 'Configurações',
    perfis: ['ADMIN', 'DIRECAO'],
    itens: [
      { href: '/admin/agencias', label: 'Agências', perfis: ['ADMIN', 'DIRECAO'] },
      { href: '/admin/gerentes', label: 'Gerentes', perfis: ['ADMIN', 'DIRECAO'] },
      { href: '/admin/motivos', label: 'Motivos', perfis: ['ADMIN', 'DIRECAO'] },
      { href: '/admin/tema', label: 'Tema', perfis: ['ADMIN', 'DIRECAO'] },
      { href: '/admin/usuarios', label: 'Usuários', perfis: ['ADMIN', 'DIRECAO'] },
    ],
  },
  {
    label: 'Minha agência',
    href: '/agencia',
    perfis: ['GESTOR_AGENCIA'],
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

  const perfil = usuario.perfil as PerfilNav
  const gruposVisiveis = NAV.filter((g) => g.perfis.includes(perfil))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold text-gray-900">
              Voxis
            </Link>
            <nav className="hidden items-center gap-5 md:flex">
              {gruposVisiveis.map((grupo) => {
                if (grupo.itens && grupo.itens.length > 0) {
                  return (
                    <GrupoDropdown
                      key={grupo.label}
                      label={grupo.label}
                      itens={grupo.itens.filter((i) =>
                        i.perfis.includes(perfil)
                      )}
                    />
                  )
                }
                return (
                  <Link
                    key={grupo.label}
                    href={grupo.href ?? '/'}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {grupo.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/ajuda"
              title="Ajuda e glossário"
              className="hidden rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 sm:inline-flex sm:items-center sm:gap-1"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
                ?
              </span>
              Ajuda
            </Link>
            <div className="hidden text-right text-xs sm:block">
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
          {gruposVisiveis.flatMap((grupo) => {
            if (grupo.itens && grupo.itens.length > 0) {
              return grupo.itens
                .filter((i) => i.perfis.includes(perfil))
                .map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    className="shrink-0 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {i.label}
                  </Link>
                ))
            }
            return [
              <Link
                key={grupo.label}
                href={grupo.href ?? '/'}
                className="shrink-0 text-sm text-gray-600 hover:text-gray-900"
              >
                {grupo.label}
              </Link>,
            ]
          })}
          <Link
            href="/ajuda"
            className="shrink-0 text-sm text-gray-600 hover:text-gray-900"
          >
            Ajuda
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}

