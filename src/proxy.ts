import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas — sem verificação
  if (
    pathname.startsWith('/avaliar') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/avaliar')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: usuario } = await supabase
    .from('usuario')
    .select('perfil, agencia_id')
    .eq('id', user.id)
    .single()

  if (!usuario) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Raiz: encaminhar pra rota do perfil
  if (pathname === '/') {
    if (usuario.perfil === 'ADMIN' || usuario.perfil === 'DIRECAO') {
      return NextResponse.redirect(new URL('/painel', request.url))
    }
    if (usuario.perfil === 'GESTOR_AGENCIA') {
      return NextResponse.redirect(new URL('/agencia', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // /admin/* — configurações: ADMIN + DIRECAO
  if (
    pathname.startsWith('/admin') &&
    !['ADMIN', 'DIRECAO'].includes(usuario.perfil)
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  // /painel/* — relatórios: ADMIN + DIRECAO
  if (
    pathname.startsWith('/painel') &&
    !['ADMIN', 'DIRECAO'].includes(usuario.perfil)
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  // /agencia/* — dashboard da própria agência: GESTOR_AGENCIA apenas
  // ADMIN/DIRECAO acessam agências via /painel/agencia/[id] (drill-down)
  if (
    pathname.startsWith('/agencia') &&
    usuario.perfil !== 'GESTOR_AGENCIA'
  ) {
    return NextResponse.redirect(new URL('/painel', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
