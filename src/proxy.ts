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

  // Buscar perfil do usuário
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
    if (usuario.perfil === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (usuario.perfil === 'DIRECAO') {
      return NextResponse.redirect(new URL('/direcao', request.url))
    }
    if (usuario.perfil === 'GESTOR_AGENCIA') {
      return NextResponse.redirect(new URL('/agencia', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Proteção por perfil
  if (pathname.startsWith('/admin') && usuario.perfil !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (
    pathname.startsWith('/direcao') &&
    !['ADMIN', 'DIRECAO'].includes(usuario.perfil)
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (
    pathname.startsWith('/agencia') &&
    !['ADMIN', 'DIRECAO', 'GESTOR_AGENCIA'].includes(usuario.perfil)
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
