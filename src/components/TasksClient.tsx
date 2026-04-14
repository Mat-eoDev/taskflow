'use client'

import { useState } from 'react'
import { createTask, updateTask, deleteTask, toggleSubtask, addSubtask, deleteSubtask } from '@/lib/actions/tasks'
import type { Task, Priority, Status } from '@/lib/types'

type Filter = 'all' | 'todo' | 'inprogress' | 'done' | 'high' | 'medium' | 'low'

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function isOverdue(d: string | null, status: Status) {
  if (!d || status === 'done') return false
  return new Date(d + 'T23:59:59') < new Date()
}

export default function TasksClient({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium' as Priority, status: 'todo' as Status, start_date: '', deadline: '' })
  const [addingSubtaskForTaskId, setAddingSubtaskForTaskId] = useState<string | null>(null)
  const [newSubtaskText, setNewSubtaskText] = useState('')

  const filtered = tasks.filter(t => {
    if (filter === 'all') return true
    if (['todo','inprogress','done'].includes(filter)) return t.status === filter
    return t.priority === filter
  }).sort((a, b) => {
    const po = { high: 0, medium: 1, low: 2 }
    if (po[a.priority] !== po[b.priority]) return po[a.priority] - po[b.priority]
    if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    if (a.deadline) return -1
    if (b.deadline) return 1
    return 0
  })

  const counts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inprogress: tasks.filter(t => t.status === 'inprogress').length,
    done: tasks.filter(t => t.status === 'done').length,
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length,
  }

  async function handleAddTask() {
    if (!newTask.title.trim()) return
    const created = await createTask({
      title: newTask.title,
      priority: newTask.priority,
      status: newTask.status,
      start_date: newTask.start_date || null,
      deadline: newTask.deadline || null,
    })
    if (created) {
      setTasks(prev => [{ ...created, subtasks: [] }, ...prev])
      setNewTask({ title: '', priority: 'medium', status: 'todo', start_date: '', deadline: '' })
      setShowAddForm(false)
    }
  }

  async function handleToggleDone(task: Task) {
    const newStatus: Status = task.status === 'done' ? 'todo' : 'done'
    await updateTask(task.id, { status: newStatus })
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
  }

  async function handleSaveModal() {
    if (!selectedTask) return
    await updateTask(selectedTask.id, {
      title: selectedTask.title,
      description: selectedTask.description || undefined,
      priority: selectedTask.priority,
      status: selectedTask.status,
      start_date: selectedTask.start_date,
      deadline: selectedTask.deadline,
    })
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? selectedTask : t))
    setSelectedTask(null)
  }

  async function handleDeleteTask() {
    if (!selectedTask) return
    await deleteTask(selectedTask.id)
    setTasks(prev => prev.filter(t => t.id !== selectedTask.id))
    setSelectedTask(null)
  }

  async function handleToggleSubtask(subtaskId: string, done: boolean) {
    if (!selectedTask) return
    await toggleSubtask(subtaskId, done)
    setSelectedTask(prev => prev ? {
      ...prev,
      subtasks: prev.subtasks?.map(s => s.id === subtaskId ? { ...s, done } : s)
    } : null)
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? {
      ...t,
      subtasks: t.subtasks?.map(s => s.id === subtaskId ? { ...s, done } : s)
    } : t))
  }

  async function handleAddSubtask() {
    if (!selectedTask || !newSubtaskText.trim()) return
    const text = newSubtaskText.trim()
    await addSubtask(selectedTask.id, text)
    const newSub = { id: Date.now().toString(), task_id: selectedTask.id, text, done: false, position: 0, created_at: new Date().toISOString() }
    setSelectedTask(prev => prev ? { ...prev, subtasks: [...(prev.subtasks || []), newSub] } : null)
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, subtasks: [...(t.subtasks || []), newSub] } : t))
    setNewSubtaskText('')
    setAddingSubtaskForTaskId(null)
  }

  async function handleDeleteSubtask(subtaskId: string) {
    if (!selectedTask) return
    await deleteSubtask(subtaskId)
    setSelectedTask(prev => prev ? { ...prev, subtasks: prev.subtasks?.filter(s => s.id !== subtaskId) } : null)
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, subtasks: t.subtasks?.filter(s => s.id !== subtaskId) } : t))
  }

  const filterLabels: Record<Filter, string> = {
    all: 'Toutes', todo: 'À faire', inprogress: 'En cours',
    done: 'Terminées', high: '🔴 Haute', medium: '🟡 Moyenne', low: '🟢 Basse'
  }

  return (
    <div className="flex h-full">

      {/* Sidebar */}
      <div className="w-52 border-r border-[#2a2a32] p-4 flex flex-col gap-6 flex-shrink-0">
        <div>
          <p className="text-xs text-[#6b6b80] uppercase tracking-widest mb-2">Statut</p>
          {(['all','todo','inprogress','done'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex justify-between items-center transition-all mb-0.5
                ${filter === f ? 'bg-[#1c1c21] text-white' : 'text-[#6b6b80] hover:text-white hover:bg-[#1c1c21]'}`}>
              <span>{filterLabels[f]}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${filter === f ? 'bg-[#7c6af7] text-white' : 'bg-[#1c1c21] text-[#6b6b80]'}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
        <div>
          <p className="text-xs text-[#6b6b80] uppercase tracking-widest mb-2">Priorité</p>
          {(['high','medium','low'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex justify-between items-center transition-all mb-0.5
                ${filter === f ? 'bg-[#1c1c21] text-white' : 'text-[#6b6b80] hover:text-white hover:bg-[#1c1c21]'}`}>
              <span>{filterLabels[f]}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${filter === f ? 'bg-[#7c6af7] text-white' : 'bg-[#1c1c21] text-[#6b6b80]'}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2a32] flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-white">{filterLabels[filter]} <span className="text-[#6b6b80] font-normal text-sm">({filtered.length})</span></h2>
          <button onClick={() => setShowAddForm(v => !v)}
            className="px-4 py-2 bg-[#7c6af7] text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity">
            + Ajouter
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">

          {/* Add form */}
          {showAddForm && (
            <div className="bg-[#1c1c21] border border-[#2a2a32] rounded-xl p-4 mb-2">
              <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                placeholder="Titre de la tâche..."
                className="w-full bg-transparent border-b border-[#2a2a32] pb-2 mb-3 text-white text-sm outline-none focus:border-[#7c6af7] transition-colors placeholder:text-[#6b6b80]" />
              <div className="flex gap-3 flex-wrap mb-3">
                {[
                  { label: 'Priorité', key: 'priority', opts: [['high','🔴 Haute'],['medium','🟡 Moyenne'],['low','🟢 Basse']] },
                  { label: 'Statut', key: 'status', opts: [['todo','À faire'],['inprogress','En cours'],['done','Terminée']] },
                ].map(({ label, key, opts }) => (
                  <div key={key} className="flex flex-col gap-1 flex-1 min-w-28">
                    <label className="text-xs text-[#6b6b80] uppercase tracking-wider">{label}</label>
                    <select value={(newTask as Record<string, string>)[key]}
                      onChange={e => setNewTask(p => ({ ...p, [key]: e.target.value }))}
                      className="bg-[#141417] border border-[#2a2a32] rounded-lg px-2 py-1.5 text-white text-xs outline-none">
                      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                ))}
                {[['start_date','Début'],['deadline','Deadline']].map(([key, label]) => (
                  <div key={key} className="flex flex-col gap-1 flex-1 min-w-28">
                    <label className="text-xs text-[#6b6b80] uppercase tracking-wider">{label}</label>
                    <input type="date" value={(newTask as Record<string, string>)[key]}
                      onChange={e => setNewTask(p => ({ ...p, [key]: e.target.value }))}
                      className="bg-[#141417] border border-[#2a2a32] rounded-lg px-2 py-1.5 text-white text-xs outline-none" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-xs text-[#6b6b80] border border-[#2a2a32] rounded-lg hover:text-white transition-colors">Annuler</button>
                <button onClick={handleAddTask} className="px-4 py-1.5 text-xs bg-[#7c6af7] text-white rounded-lg hover:opacity-90 transition-opacity">Créer</button>
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-[#6b6b80] gap-3 py-20">
              <span className="text-4xl opacity-30">📋</span>
              <p className="text-sm text-center">Aucune tâche.<br />Utilisez le chat ou "Ajouter".</p>
            </div>
          )}

          {filtered.map(task => {
            const doneSubs = (task.subtasks || []).filter(s => s.done).length
            const totalSubs = (task.subtasks || []).length
            const progress = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0
            const overdue = isOverdue(task.deadline, task.status)

            return (
              <div key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`bg-[#141417] border border-[#2a2a32] rounded-xl p-4 cursor-pointer hover:border-[#7c6af7] transition-all relative overflow-hidden
                  ${task.status === 'done' ? 'opacity-50' : ''}`}>
                <div className={`absolute left-0 top-0 bottom-0 w-0.5
                  ${task.priority === 'high' ? 'bg-[#f76a6a]' : task.priority === 'medium' ? 'bg-[#f7d66a]' : 'bg-[#6af7c4]'}`} />

                <div className="flex gap-3 items-start pl-2">
                  <div onClick={e => { e.stopPropagation(); handleToggleDone(task) }}
                    className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center cursor-pointer transition-all
                      ${task.status === 'done' ? 'bg-[#7c6af7] border-[#7c6af7]' : 'border-[#2a2a32] hover:border-[#7c6af7]'}`}>
                    {task.status === 'done' && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold text-white truncate ${task.status === 'done' ? 'line-through' : ''}`}>{task.title}</p>
                    {task.description && <p className="text-xs text-[#6b6b80] mt-0.5 line-clamp-1">{task.description}</p>}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {task.deadline && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${overdue ? 'border-[#f76a6a] text-[#f76a6a]' : 'border-[#7c6af7] text-[#7c6af7]'}`}>
                          📅 {formatDate(task.deadline)}{overdue ? ' !' : ''}
                        </span>
                      )}
                      {totalSubs > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-[#2a2a32] text-[#6b6b80]">
                          ☰ {doneSubs}/{totalSubs}
                        </span>
                      )}
                    </div>
                    {totalSubs > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1 bg-[#2a2a32] rounded-full overflow-hidden">
                          <div className="h-full bg-[#7c6af7] rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-[#6b6b80]">{progress}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setSelectedTask(null)}>
          <div className="bg-[#141417] border border-[#2a2a32] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">

            <div className="p-5 border-b border-[#2a2a32] flex gap-3">
              <div className="flex-1">
                <input value={selectedTask.title}
                  onChange={e => setSelectedTask(p => p ? { ...p, title: e.target.value } : null)}
                  className="w-full bg-transparent text-white font-bold text-base outline-none border-b border-transparent focus:border-[#7c6af7] pb-1 transition-colors" />
                <div className="flex gap-2 mt-3">
                  {(['todo','inprogress','done'] as Status[]).map(s => (
                    <button key={s} onClick={() => setSelectedTask(p => p ? { ...p, status: s } : null)}
                      className={`flex-1 py-1.5 rounded-lg text-xs border transition-all
                        ${selectedTask.status === s
                          ? s === 'todo' ? 'border-[#7c6af7] text-[#7c6af7] bg-[#7c6af7]/10'
                          : s === 'inprogress' ? 'border-[#f7d66a] text-[#f7d66a] bg-[#f7d66a]/10'
                          : 'border-[#6af7a0] text-[#6af7a0] bg-[#6af7a0]/10'
                          : 'border-[#2a2a32] text-[#6b6b80] hover:border-[#6b6b80]'}`}>
                      {s === 'todo' ? 'À faire' : s === 'inprogress' ? 'En cours' : 'Terminée'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)}
                className="w-8 h-8 border border-[#2a2a32] rounded-lg text-[#6b6b80] hover:text-white flex items-center justify-center transition-colors flex-shrink-0">✕</button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#6b6b80] uppercase tracking-wider">Priorité</label>
                  <select value={selectedTask.priority}
                    onChange={e => setSelectedTask(p => p ? { ...p, priority: e.target.value as Priority } : null)}
                    className="bg-[#1c1c21] border border-[#2a2a32] rounded-lg px-2 py-2 text-white text-xs outline-none focus:border-[#7c6af7]">
                    <option value="high">🔴 Haute</option>
                    <option value="medium">🟡 Moyenne</option>
                    <option value="low">🟢 Basse</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#6b6b80] uppercase tracking-wider">Début</label>
                  <input type="date" value={selectedTask.start_date || ''}
                    onChange={e => setSelectedTask(p => p ? { ...p, start_date: e.target.value || null } : null)}
                    className="bg-[#1c1c21] border border-[#2a2a32] rounded-lg px-2 py-2 text-white text-xs outline-none focus:border-[#7c6af7]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#6b6b80] uppercase tracking-wider">Deadline</label>
                  <input type="date" value={selectedTask.deadline || ''}
                    onChange={e => setSelectedTask(p => p ? { ...p, deadline: e.target.value || null } : null)}
                    className="bg-[#1c1c21] border border-[#2a2a32] rounded-lg px-2 py-2 text-white text-xs outline-none focus:border-[#7c6af7]" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6b6b80] uppercase tracking-wider">Description</label>
                <textarea value={selectedTask.description || ''}
                  onChange={e => setSelectedTask(p => p ? { ...p, description: e.target.value } : null)}
                  rows={3}
                  className="bg-[#1c1c21] border border-[#2a2a32] rounded-lg px-3 py-2 text-white text-xs outline-none resize-none focus:border-[#7c6af7] transition-colors placeholder:text-[#6b6b80]"
                  placeholder="Détails de la tâche..." />
              </div>

              <div>
                <p className="text-xs text-[#6b6b80] uppercase tracking-wider mb-2">Sous-tâches</p>
                {(selectedTask.subtasks || []).map(s => (
                  <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-[#1c1c21]">
                    <div onClick={() => handleToggleSubtask(s.id, !s.done)}
                      className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center cursor-pointer transition-all
                        ${s.done ? 'bg-[#7c6af7] border-[#7c6af7]' : 'border-[#2a2a32] hover:border-[#7c6af7]'}`}>
                      {s.done && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={`flex-1 text-xs ${s.done ? 'line-through text-[#6b6b80]' : 'text-white'}`}>{s.text}</span>
                    <button onClick={() => handleDeleteSubtask(s.id)} className="text-[#6b6b80] hover:text-[#f76a6a] transition-colors text-sm">×</button>
                  </div>
                ))}
                {addingSubtaskForTaskId === selectedTask.id ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      autoFocus
                      value={newSubtaskText}
                      onChange={e => setNewSubtaskText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddSubtask()
                        if (e.key === 'Escape') { setAddingSubtaskForTaskId(null); setNewSubtaskText('') }
                      }}
                      placeholder="Nouvelle sous-tâche..."
                      className="flex-1 bg-[#1c1c21] border border-[#7c6af7] rounded-lg px-3 py-1.5 text-white text-xs outline-none placeholder:text-[#6b6b80]"
                    />
                    <button onClick={handleAddSubtask}
                      className="px-3 py-1.5 text-xs bg-[#7c6af7] text-white rounded-lg hover:opacity-90 transition-opacity">
                      ✓
                    </button>
                    <button onClick={() => { setAddingSubtaskForTaskId(null); setNewSubtaskText('') }}
                      className="px-3 py-1.5 text-xs border border-[#2a2a32] text-[#6b6b80] rounded-lg hover:text-white transition-colors">
                      ✕
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setAddingSubtaskForTaskId(selectedTask.id)}
                    className="w-full mt-2 py-2 border border-dashed border-[#2a2a32] rounded-lg text-xs text-[#6b6b80] hover:border-[#7c6af7] hover:text-[#7c6af7] transition-all">
                    + Ajouter une sous-tâche
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-[#2a2a32] flex gap-2 justify-end">
              <button onClick={handleDeleteTask} className="px-4 py-2 text-xs text-[#f76a6a] border border-[#f76a6a] rounded-lg hover:bg-[#f76a6a] hover:text-white transition-all">Supprimer</button>
              <button onClick={handleSaveModal} className="px-4 py-2 text-xs bg-[#7c6af7] text-white rounded-lg hover:opacity-90 transition-opacity">Sauvegarder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}