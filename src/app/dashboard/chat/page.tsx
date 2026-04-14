'use client'

import { useState, useRef, useEffect } from 'react'
import { createTask } from '@/lib/actions/tasks'
import type { Priority } from '@/lib/types'

interface ParsedTask {
  title: string
  description: string
  priority: Priority
  start_date: string | null
  deadline: string | null
  subtasks: string[]
}

interface Message {
  id: number
  type: 'user' | 'ai'
  content: string
  tasks?: ParsedTask[]
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([{
    id: 0,
    type: 'ai',
    content: "Bonjour ! Décrivez-moi ce que vous devez faire et je structure vos tâches automatiquement.\n\nEx: \"Je dois préparer la présentation client pour vendredi, relire le contrat avant jeudi\"",
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [validated, setValidated] = useState<Set<number>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: text }])
    setLoading(true)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        content: data.message || "Voici ce que j'ai trouvé :",
        tasks: data.tasks || []
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        content: 'Une erreur est survenue.'
      }])
    }
    setLoading(false)
  }

  async function handleValidate(key: number, task: ParsedTask) {
    await createTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: 'todo',
      start_date: task.start_date,
      deadline: task.deadline,
      subtasks: task.subtasks
    })
    setValidated(prev => new Set(prev).add(key))
  }

  async function handleValidateAll(msgId: number, tasks: ParsedTask[]) {
    for (const task of tasks) {
      await createTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: 'todo',
        start_date: task.start_date,
        deadline: task.deadline,
        subtasks: task.subtasks
      })
    }
    setValidated(prev => new Set(prev).add(msgId))
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto px-4">

      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>

            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 font-bold
              ${msg.type === 'ai'
                ? 'bg-[#1c1c21] border border-[#2a2a32] text-[#7c6af7]'
                : 'bg-[#7c6af7] text-white'}`}>
              {msg.type === 'ai' ? '✦' : 'M'}
            </div>

            <div className={`flex flex-col gap-2 flex-1 ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap
                ${msg.type === 'user'
                  ? 'bg-[#7c6af7] text-white rounded-tr-sm max-w-[80%]'
                  : 'bg-[#141417] border border-[#2a2a32] text-[#e8e8f0] rounded-tl-sm'}`}>
                {msg.content}
              </div>

              {msg.tasks && msg.tasks.length > 0 && (
                <div className="flex flex-col gap-2 w-full max-w-lg">

                  {msg.tasks.length > 1 && !validated.has(msg.id) && (
                    <button
                      onClick={() => handleValidateAll(msg.id, msg.tasks!)}
                      className="w-full py-2 bg-[#7c6af7] text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity">
                      Valider toutes les taches ({msg.tasks.length})
                    </button>
                  )}

                  {msg.tasks.map((task, i) => (
                    <div key={i} className="bg-[#141417] border border-[#7c6af7]/40 rounded-xl p-4">

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0
                          ${task.priority === 'high' ? 'border-[#f76a6a] text-[#f76a6a]'
                          : task.priority === 'medium' ? 'border-[#f7d66a] text-[#f7d66a]'
                          : 'border-[#6af7c4] text-[#6af7c4]'}`}>
                          {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-[#6b6b80] mb-2 leading-relaxed">{task.description}</p>
                      )}

                      <div className="flex gap-2 flex-wrap mb-3">
                        {task.start_date && (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-[#2a2a32] text-[#6b6b80]">
                            {formatDate(task.start_date)}
                          </span>
                        )}
                        {task.deadline && (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-[#7c6af7] text-[#7c6af7]">
                            {formatDate(task.deadline)}
                          </span>
                        )}
                      </div>

                      {task.subtasks.length > 0 && (
                        <div className="mb-3">
                          {task.subtasks.map((s, j) => (
                            <div key={j} className="text-xs text-[#6b6b80] py-1 flex items-center gap-1.5">
                              <span className="text-[#2a2a32]">-</span> {s}
                            </div>
                          ))}
                        </div>
                      )}

                      {validated.has(msg.id * 1000 + i) || validated.has(msg.id) ? (
                        <div className="text-center text-xs text-[#6af7a0] py-1">
                          Ajoutee au dashboard
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleValidate(msg.id * 1000 + i, task)}
                            className="flex-1 py-2 bg-[#7c6af7] text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity">
                            Valider
                          </button>
                          <button className="px-3 py-2 border border-[#2a2a32] text-[#6b6b80] rounded-lg text-xs hover:border-[#f76a6a] hover:text-[#f76a6a] transition-all">
                            X
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1c1c21] border border-[#2a2a32] flex items-center justify-center text-[#7c6af7] font-bold text-sm flex-shrink-0">
              ✦
            </div>
            <div className="bg-[#141417] border border-[#2a2a32] rounded-xl px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <div key={i}
                  className="w-1.5 h-1.5 bg-[#7c6af7] rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="py-4 border-t border-[#2a2a32]">
        <div className="flex gap-2 items-end bg-[#1c1c21] border border-[#2a2a32] rounded-xl px-4 py-3 focus-within:border-[#7c6af7] transition-colors">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Decrivez vos taches en langage naturel..."
            rows={1}
            className="flex-1 bg-transparent outline-none text-white text-sm resize-none max-h-32 placeholder:text-[#6b6b80]"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-8 h-8 bg-[#7c6af7] rounded-lg flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <p className="text-xs text-[#6b6b80] text-center mt-2">
          Entree pour envoyer - Shift+Entree pour nouvelle ligne
        </p>
      </div>

    </div>
  )
}