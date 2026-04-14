'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Priority, Status } from '@/lib/types'

export async function getTasks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('tasks')
    .select('*, subtasks(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return data || []
}

export async function createTask(task: {
  title: string
  description?: string
  priority: Priority
  status: Status
  start_date?: string | null
  deadline?: string | null
  subtasks?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: newTask } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: task.title,
      description: task.description || null,
      priority: task.priority,
      status: task.status,
      start_date: task.start_date || null,
      deadline: task.deadline || null,
    })
    .select()
    .single()

  if (newTask && task.subtasks && task.subtasks.length > 0) {
    await supabase.from('subtasks').insert(
      task.subtasks.map((text, i) => ({
        task_id: newTask.id,
        text,
        position: i,
        done: false
      }))
    )
  }

  revalidatePath('/dashboard/tasks')
  return newTask
}

export async function updateTask(id: string, updates: {
  title?: string
  description?: string
  priority?: Priority
  status?: Status
  start_date?: string | null
  deadline?: string | null
}) {
  const supabase = await createClient()

  await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)

  revalidatePath('/dashboard/tasks')
}

export async function deleteTask(id: string) {
  const supabase = await createClient()

  await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  revalidatePath('/dashboard/tasks')
}

export async function toggleSubtask(id: string, done: boolean) {
  const supabase = await createClient()

  await supabase
    .from('subtasks')
    .update({ done })
    .eq('id', id)

  revalidatePath('/dashboard/tasks')
}

export async function addSubtask(taskId: string, text: string) {
  const supabase = await createClient()

  await supabase
    .from('subtasks')
    .insert({ task_id: taskId, text, done: false })

  revalidatePath('/dashboard/tasks')
}

export async function deleteSubtask(id: string) {
  const supabase = await createClient()

  await supabase
    .from('subtasks')
    .delete()
    .eq('id', id)

  revalidatePath('/dashboard/tasks')
}