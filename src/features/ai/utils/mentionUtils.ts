import { MentionType, ChatMention } from '@/features/ai/types'
import { KanbanTask, Project } from '@/shared/types'

export function findTaskMentions(
  project: Project | null,
  searchTerm: string = '',
  limit: number = 10
): ChatMention[] {
  if (!project || !project.kanban.columns) {
    return []
  }

  const searchTermLower = searchTerm.toLowerCase()
  const taskMentions: ChatMention[] = []

  for (const column of project.kanban.columns) {
    if (!column.tasks) continue

    for (const task of column.tasks) {
      if (searchTerm && !task.title.toLowerCase().includes(searchTermLower)) {
        continue
      }

      taskMentions.push({
        type: MentionType.TASK,
        id: task.id,
        displayText: task.title,
        searchText: task.title,
        entity: task as KanbanTask,
      })

      if (taskMentions.length >= limit) {
        break
      }
    }
  }

  return taskMentions
}
