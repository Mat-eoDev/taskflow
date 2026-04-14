import { createClient } from '@/lib/supabase/server'
import { getTasks } from '@/lib/actions/tasks'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const tasks = await getTasks()

  const todo = tasks.filter(t => t.status === 'todo').length
  const inprogress = tasks.filter(t => t.status === 'inprogress').length
  const done = tasks.filter(t => t.status === 'done').length
  const overdue = tasks.filter(t =>
    t.deadline && t.status !== 'done' &&
    new Date(t.deadline + 'T23:59:59') < new Date()
  ).length
  const completion = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0

  const urgent = tasks
    .filter(t => t.priority === 'high' && t.status !== 'done')
    .sort((a, b) => {
      if (a.deadline && b.deadline)
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      if (a.deadline) return -1
      return 1
    })
    .slice(0, 3)

  const stats = [
    { label: 'À faire', value: todo, color: '#7c6af7' },
    { label: 'En cours', value: inprogress, color: '#f7d66a' },
    { label: 'Terminées', value: done, color: '#6af7a0' },
    { label: 'En retard', value: overdue, color: '#f76a6a' },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">

      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">
          Bonjour{profile?.full_name ? `, ${profile.full_name}` : ''} 👋
        </h1>
        <p className="text-[#6b6b80] text-sm mt-1">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long'
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-[#141417] border border-[#2a2a32] rounded-xl p-4">
            <p className="text-xs text-[#6b6b80] mb-1">{label}</p>
            <p className="text-3xl font-black" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {tasks.length > 0 && (
        <div className="bg-[#141417] border border-[#2a2a32] rounded-xl p-5 mb-8">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-white">Progression globale</p>
            <p className="text-sm font-bold text-[#7c6af7]">{completion}%</p>
          </div>
          <div className="h-2 bg-[#1c1c21] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#7c6af7] rounded-full transition-all duration-700"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-xs text-[#6b6b80] mt-2">
            {done} tâche{done > 1 ? 's' : ''} terminée{done > 1 ? 's' : ''} sur {tasks.length}
          </p>
        </div>
      )}

      {urgent.length > 0 && (
        <div className="bg-[#141417] border border-[#2a2a32] rounded-xl p-5 mb-8">
          <p className="text-sm font-semibold text-white mb-3">🔴 Priorité haute</p>
          <div className="flex flex-col gap-2">
            {urgent.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between py-2 border-b border-[#1c1c21] last:border-none"
              >
                <p className="text-sm text-white">{task.title}</p>
                {task.deadline && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    new Date(task.deadline + 'T23:59:59') < new Date()
                      ? 'border-[#f76a6a] text-[#f76a6a]'
                      : 'border-[#7c6af7] text-[#7c6af7]'
                  }`}>
                    📅 {new Date(task.deadline + 'T12:00:00').toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short'
                    })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/dashboard/chat"
          className="bg-[#7c6af7] rounded-xl p-5 hover:opacity-90 transition-opacity"
        >
          <p className="text-2xl mb-2">💬</p>
          <p className="text-white font-semibold text-sm">Chat IA</p>
          <p className="text-white/60 text-xs mt-0.5">Créer des tâches en langage naturel</p>
        </Link>
        <Link
          href="/dashboard/tasks"
          className="bg-[#141417] border border-[#2a2a32] rounded-xl p-5 hover:border-[#7c6af7] transition-all"
        >
          <p className="text-2xl mb-2">📋</p>
          <p className="text-white font-semibold text-sm">Mes tâches</p>
          <p className="text-[#6b6b80] text-xs mt-0.5">Gérer et suivre vos tâches</p>
        </Link>
      </div>

    </div>
  )
}