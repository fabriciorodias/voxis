import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verificarRateLimit } from '@/lib/antifraude'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { gr_id, device_hash } = body as {
      gr_id?: string
      device_hash?: string
    }

    if (!gr_id || !device_hash) {
      return NextResponse.json(
        { error: 'gr_id e device_hash são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { permitido } = await verificarRateLimit(supabase, gr_id, device_hash)

    return NextResponse.json({ permitido })
  } catch (err) {
    console.error('[/api/avaliar/check] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
