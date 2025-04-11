import { Project, KanbanTask, TaskPriority, KanbanColumn } from '@/shared/types'

// Maximum characters in the project context to avoid exceeding the token limit
const MAX_CONTEXT_SIZE = 10000

// Function to properly escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

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

  let contextString = `<project>\n`
  contextString += `  <project_title>${escapeXml(project.title)}</project_title>\n`
  contextString += `  <project_id>${project.id}</project_id>\n`

  if (project.description) {
    contextString += `  <project_description>${escapeXml(project.description)}</project_description>\n`
  }

  contextString += `  <stats>\n`
  contextString += `    <total_tasks>${totalTasks}</total_tasks>\n`
  contextString += `    <total_columns>${columns.length}</total_columns>\n`
  contextString += `  </stats>\n\n`

  contextString += `  <board>\n`

  const tasksByID: Record<string, { title: string; columnTitle: string }> = {}

  columns.forEach((col) => {
    contextString += `    <column name="${escapeXml(col.title)}" task_count="${col.tasks.length}">\n`

    if (col.tasks.length === 0) {
      contextString += `      <no_tasks/>\n`
      contextString += `    </column>\n`
      return
    }

    const priorityGroups: Record<string, KanbanTask[]> = {
      URGENT: col.tasks.filter((task) => task.priority === TaskPriority.URGENT),
      HIGH: col.tasks.filter((task) => task.priority === TaskPriority.HIGH),
      MEDIUM: col.tasks.filter((task) => task.priority === TaskPriority.MEDIUM),
      LOW: col.tasks.filter((task) => task.priority === TaskPriority.LOW),
    }

    let taskIndexInColumn = 1

    Object.entries(priorityGroups).forEach(([priority, tasks]) => {
      if (tasks.length === 0) return

      contextString += `      <priority_group level="${priority}" task_count="${tasks.length}">\n`

      tasks.forEach((task) => {
        tasksByID[task.id] = {
          title: task.title,
          columnTitle: col.title,
        }

        contextString += `        <task index="${taskIndexInColumn}" total="${col.tasks.length}">\n`
        contextString += `          <id>${task.id}</id>\n`
        contextString += `          <title>${escapeXml(task.title)}</title>\n`
        contextString += `          <priority>${priority}</priority>\n`

        if (task.description) {
          const shortDesc =
            task.description.length > 100
              ? task.description.substring(0, 100) + '...'
              : task.description
          // Make description tags more prominent with attributes
          contextString += `          <DESCRIPTION important="true" exists="true">${escapeXml(shortDesc)}</DESCRIPTION>\n`
        } else {
          // Explicitly note when description is missing
          contextString += `          <DESCRIPTION exists="false">No description provided</DESCRIPTION>\n`
        }

        contextString += `        </task>\n`

        taskIndexInColumn++
      })

      contextString += `      </priority_group>\n`
    })

    contextString += `    </column>\n`
  })

  contextString += `  </board>\n`
  contextString += `</project>\n`

  const projectSummary = `IMPORTANT SUMMARY: Project "${escapeXml(project.title)}" contains ${totalTasks} tasks across ${columns.length} columns: ${columns.map((c) => `${escapeXml(c.title)}(${c.tasks.length})`).join(', ')}.`

  // Important: Add summary at both beginning and end for retention (primacy-recency effect)
  contextString =
    projectSummary +
    '\n\n' +
    contextString +
    '\n\n' +
    projectSummary +
    '\n\nPAY ATTENTION: Many tasks have descriptions. When discussing tasks, always check and mention their descriptions.'

  if (contextString.length > MAX_CONTEXT_SIZE) {
    // Preserve the XML structure by truncating the middle
    const startTag = '<project>'
    const endTag = '</project>'
    const startPos = contextString.indexOf(startTag) + startTag.length
    const endPos = contextString.lastIndexOf(endTag)

    if (startPos >= 0 && endPos >= 0) {
      const startPart = contextString.substring(0, startPos + 1000) // Keep start with buffer
      const endPart = contextString.substring(endPos - 1000) // Keep end with buffer

      contextString =
        startPart +
        '\n<!-- Content truncated due to size limits -->\n' +
        endPart
    } else {
      // Fallback if structure is broken
      contextString =
        contextString.substring(0, MAX_CONTEXT_SIZE - 100) +
        '\n<!-- Content truncated due to size limits -->\n'
    }
  }

  return {
    summaryString,
    contextString,
    totalTasks,
    totalColumns: columns.length,
  }
}
