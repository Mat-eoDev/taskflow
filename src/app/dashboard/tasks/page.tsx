import { getTasks } from '@/lib/actions/tasks'
import TasksClient from '@/components/TasksClient'

export default async function TasksPage() {
  const tasks = await getTasks()
  return <TasksClient initialTasks={tasks} />
}