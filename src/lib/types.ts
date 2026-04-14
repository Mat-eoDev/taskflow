export type Priority = 'low' | 'medium' | 'high'
export type Status = 'todo' | 'inprogress' | 'done'

export interface Subtask {
  id: string
  task_id: string
  text: string
  done: boolean
  position: number
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: Status
  priority: Priority
  start_date: string | null
  deadline: string | null
  created_at: string
  updated_at: string
  subtasks?: Subtask[]
}

export interface Profile {
  id: string
  email: string
  role: 'admin' | 'user'
  full_name: string | null
  created_at: string
}