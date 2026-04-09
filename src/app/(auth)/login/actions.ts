'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    redirect('/login?erro=campos')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?erro=credenciais')
  }

  // Buscar perfil pra decidir a rota inicial
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?erro=sessao')
  }

  const { data: usuario } = await supabase
    .from('usuario')
    .select('perfil')
    .eq('id', user.id)
    .single()

  if (!usuario) {
    await supabase.auth.signOut()
    redirect('/login?erro=perfil')
  }

  switch (usuario.perfil) {
    case 'ADMIN':
      redirect('/admin')
    case 'DIRECAO':
      redirect('/direcao')
    case 'GESTOR_AGENCIA':
      redirect('/agencia')
    default:
      redirect('/login?erro=perfil')
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
