import { Project, TaskPriority } from '@/shared/types'

export const getBasicSystemPrompt = () => `
You are Vector, a project management assistant for a Kanban app.

When responding to users:
- Use a casual, straightforward tone. Avoid excessive enthusiasm but don't be robotic.
- Be conversational and natural. Use contractions and everyday language.
- Adapt your tone to match the user - more professional for work questions, more casual for banter.
- Show personality when appropriate. It's okay to have a sense of humor.
- Never refer to yourself as an AI, assistant, or language model.

IMPORTANT: When you see a user message starting with [FIRST_MESSAGE], this is your first interaction with them. For this first response, always start with:
- Project name
- Number of high priority tasks
- Status of active tasks or suggested next steps

While project management is your primary focus, you can engage with off-topic questions naturally. If the user wants to chat about other topics, go with it - you're helpful for all kinds of conversations. Only gently return to project topics if it seems the user has forgotten what they were working on.

Remember that building rapport is as important as providing information.
`

export const getProjectContextPrompt = (project: Project) => {
  if (!project) return ''

  let kanbanStructure = ''

  project.kanban.columns?.forEach((col) => {
    kanbanStructure += `\n$ "${col.title} col" (ID: ${col.id}) $\n`
    kanbanStructure += `Tasks in column: ${col.tasks.length}\n`

    const highPriorityTasks = col.tasks.filter(
      (task) => task.priority === TaskPriority.HIGH
    )
    const mediumPriorityTasks = col.tasks.filter(
      (task) => task.priority === TaskPriority.MEDIUM
    )
    const lowPriorityTasks = col.tasks.filter(
      (task) => task.priority === TaskPriority.LOW
    )
    const urgentTasks = col.tasks.filter(
      (task) => task.priority === TaskPriority.URGENT
    )

    const urgentTasksInfo = urgentTasks.map((t) => `"${t.title}" (${t.id})`)
    const highTasksInfo = highPriorityTasks.map((t) => `"${t.title}" (${t.id})`)
    const mediumTasksInfo = mediumPriorityTasks.map(
      (t) => `"${t.title}" (${t.id})`
    )
    const lowTasksInfo = lowPriorityTasks.map((t) => `"${t.title}" (${t.id})`)

    const priorityCounts = []
    if (urgentTasks.length) priorityCounts.push(`${urgentTasks.length} urgent`)
    if (highPriorityTasks.length)
      priorityCounts.push(`${highPriorityTasks.length} high`)
    if (mediumPriorityTasks.length)
      priorityCounts.push(`${mediumPriorityTasks.length} medium`)
    if (lowPriorityTasks.length)
      priorityCounts.push(`${lowPriorityTasks.length} low`)

    const prioritiesText = priorityCounts.length
      ? priorityCounts.join(', ')
      : 'none'

    kanbanStructure += `Priorities: ${prioritiesText}\n`

    if (urgentTasks.length) {
      kanbanStructure += `\n  [Urgent] tasks: ${urgentTasksInfo.join(', ')}\n`
    }
    if (highPriorityTasks.length) {
      kanbanStructure += `\n  [High] tasks: ${highTasksInfo.join(', ')}\n`
    }
    if (mediumPriorityTasks.length) {
      kanbanStructure += `\n  [Medium] tasks: ${mediumTasksInfo.join(', ')}\n`
    }
    if (lowPriorityTasks.length) {
      kanbanStructure += `\n  [Low] tasks: ${lowTasksInfo.join(', ')}\n`
    }
  })

  return `
Project: "${project.title}" (${project.id})
Description: ${project.description || 'None'}

Kanban Structure: 
${kanbanStructure || 'Empty board'}

When discussing this project:
1. Reference specific tasks by name when relevant
2. Suggest concrete next steps based on current board state
3. Keep responses focused on actionable advice
4. Use tools when the user wants to make changes
5. Be flexible - if the conversation drifts to other topics, that's perfectly fine
`
}
