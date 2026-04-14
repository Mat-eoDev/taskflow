'use client'

import { useState } from 'react'
import type { Profile } from '@/lib/types'

export default function AdminClient({ users }: { users: Profile[] }) {
  const [list, setList] = useState<Profile[]>(users)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName })
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage({ type: 'error', text: data.error || 'Erreur lors de la création' })
    } else {
      setMessage({ type: 'success', text: `Compte créé pour ${email}` })
      setList(prev => [data.profile, ...prev])
      setEmail('')
      setPassword('')
      setFullName('')
    }

    setLoading(false)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">

      <h1 className="text-2xl font-black text-white mb-8">⚙️ Administration</h1>

      {/* Create user form */}
      <div className="bg-[#141417] border border-[#2a2a32] rounded-2xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-white mb-4">Créer un compte utilisateur</h2>

        <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#6b6b80] uppercase tracking-wider">Nom complet</label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jean Dupont"
                className="bg-[#1c1c21] border border-[#2a2a32] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#7c6af7] transition-colors placeholder:text-[#6b6b80]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#6b6b80] uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="jean@exemple.com"
                className="bg-[#1c1c21] border border-[#2a2a32] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#7c6af7] transition-colors placeholder:text-[#6b6b80]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#6b6b80] uppercase tracking-wider">Mot de passe temporaire</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="bg-[#1c1c21] border border-[#2a2a32] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#7c6af7] transition-colors placeholder:text-[#6b6b80]"
            />
          </div>

          {message && (
            <p className={`text-xs text-center py-2 rounded-lg ${message.type === 'success' ? 'text-[#6af7a0] bg-[#6af7a0]/10' : 'text-[#f76a6a] bg-[#f76a6a]/10'}`}>
              {message.type === 'success' ? '✓' : '✕'} {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="py-2.5 bg-[#7c6af7] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {loading ? 'Création...' : 'Créer le compte'}
          </button>
        </form>
      </div>

      {/* Users list */}
      <div className="bg-[#141417] border border-[#2a2a32] rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">
          Utilisateurs <span className="text-[#6b6b80] font-normal">({list.length})</span>
        </h2>
        <div className="flex flex-col gap-2">
          {list.map(u => (
            <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-[#1c1c21] last:border-none">
              <div>
                <p className="text-sm text-white">{u.full_name || '—'}</p>
                <p className="text-xs text-[#6b6b80]">{u.email}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border
                ${u.role === 'admin'
                  ? 'border-[#f7a26a] text-[#f7a26a]'
                  : 'border-[#2a2a32] text-[#6b6b80]'}`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}