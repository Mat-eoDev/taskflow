import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Vérifier que c'est un admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { email, password, full_name } = await request.json()
  if (!email || !password) return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })

  // Créer l'utilisateur avec le client admin
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name }
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Mettre à jour le profil avec le full_name
  if (full_name && data.user) {
    await adminClient.from('profiles').update({ full_name }).eq('id', data.user.id)
  }

  const { data: newProfile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', data.user!.id)
    .single()

  return NextResponse.json({ profile: newProfile })
}