'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-[#6b6b80] border border-[#2a2a32] rounded-lg px-3 py-1.5 hover:text-white hover:border-[#6b6b80] transition-all"
    >
      Déconnexion
    </button>
  )
}