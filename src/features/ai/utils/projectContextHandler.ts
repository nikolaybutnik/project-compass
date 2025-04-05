import { Project, KanbanTask, TaskPriority, KanbanColumn } from '@/shared/types'

// Maximum characters in the project context to avoid exceeding the token limit
const MAX_CONTEXT_SIZE = 10000

export function extractProjectContext(project: Project): {
  summaryString: string
  contextString: string
  totalTasks: number
  totalColumns: number
} {
  if (!project || !project.kanban?.columns) {
    return {
      contextString: '',
      summaryString: 'No project data available',
      totalTasks: 0,
      totalColumns: 0,
    }
  }

  const columns: KanbanColumn[] = project.kanban.columns
  const totalTasks: number = columns.reduce(
    (sum, col) => sum + col.tasks.length,
    0
  )

  const summaryString = `Project: ${project.title} | ID: (${project.id}) | ${totalTasks} tasks across ${columns.length} columns`
  let contextString = `PROJECT: "${project.title}"\n`
  contextString += `Description: ${project.description || 'None'}\n\n`
  contextString += `BOARD STRUCTURE:\n`

  const tasksByID: Record<string, { title: string; columnTitle: string }> = {}

  columns.forEach((col) => {
    contextString += `\n--- COLUMN: "${col.title}" ---\n`

    if (col.tasks.length === 0) {
      contextString += `No tasks.\n`
      return
    }

    const priorityGroups: Record<string, KanbanTask[]> = {
      URGENT: col.tasks.filter((task) => task.priority === TaskPriority.URGENT),
      HIGH: col.tasks.filter((task) => task.priority === TaskPriority.HIGH),
      MEDIUM: col.tasks.filter((task) => task.priority === TaskPriority.MEDIUM),
      LOW: col.tasks.filter((task) => task.priority === TaskPriority.LOW),
    }

    Object.entries(priorityGroups).forEach(([priority, tasks]) => {
      if (tasks.length === 0) return

      contextString += `${priority} PRIORITY (${tasks.length} tasks):\n`

      tasks.forEach((task, i) => {
        tasksByID[task.id] = {
          title: task.title,
          columnTitle: col.title,
        }

        contextString += `  ${i + 1}. "${task.title}" (ID: ${task.id})\n`
        if (task.description) {
          const shortDesc =
            task.description.length > 100
              ? task.description.substring(0, 100) + '...'
              : task.description
          contextString += `Description: ${shortDesc}\n`
        }
        contextString += '\n'
      })
    })
  })

  if (contextString.length > MAX_CONTEXT_SIZE) {
    contextString =
      contextString.substring(0, MAX_CONTEXT_SIZE) +
      '\n[Project context truncated due to size limit. Some tasks may not be shown.]\n'
  }

  return {
    summaryString,
    contextString,
    totalTasks,
    totalColumns: columns.length,
  }
}
