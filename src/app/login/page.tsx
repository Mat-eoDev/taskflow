'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Task<span className="text-[#7c6af7]">Flow</span>
          </h1>
          <p className="text-[#6b6b80] text-sm mt-2">Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#141417] border border-[#2a2a32] rounded-2xl p-6 flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#6b6b80] uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="vous@exemple.com"
              className="bg-[#1c1c21] border border-[#2a2a32] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#7c6af7] transition-colors placeholder:text-[#6b6b80]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#6b6b80] uppercase tracking-wider">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="bg-[#1c1c21] border border-[#2a2a32] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#7c6af7] transition-colors placeholder:text-[#6b6b80]"
            />
          </div>

          {error && (
            <p className="text-[#f76a6a] text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#7c6af7] text-white rounded-lg py-2.5 text-sm font-medium mt-1 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

        </form>
      </div>
    </div>
  )
}