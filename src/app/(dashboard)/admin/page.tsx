import Link from 'next/link'

const CARDS = [
  {
    href: '/admin/agencias',
    titulo: 'Agências',
    descricao: 'Cadastrar agências e superintendências',
  },
  {
    href: '/admin/gerentes',
    titulo: 'Gerentes',
    descricao: 'Gerenciar GRs e QR Codes de avaliação',
  },
  {
    href: '/admin/motivos',
    titulo: 'Motivos',
    descricao: 'Opções de motivo mostradas ao cliente (máx. 4)',
  },
  {
    href: '/admin/tema',
    titulo: 'Tema',
    descricao: 'Cores, logo e identidade visual do banco',
  },
  {
    href: '/admin/usuarios',
    titulo: 'Usuários',
    descricao: 'Controle de acesso da direção e gestores',
  },
]

export default function AdminHome() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
        <p className="text-sm text-gray-500">
          Configurações da instância e cadastros principais.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[var(--color-primary)] hover:shadow"
          >
            <h2 className="text-base font-semibold text-gray-900">
              {c.titulo}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{c.descricao}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
