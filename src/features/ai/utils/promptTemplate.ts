import { Project } from '@/shared/types'
import { extractProjectContext } from '@/features/ai/utils/projectContextHandler'
import {
  ContextUpdate,
  ContextUpdateTrigger,
  MessageRole,
} from '@/features/ai/types'

const CONTEXT_UPDATE_LOCATIONS: Record<
  ContextUpdateTrigger,
  {
    description: string
    location: string
    marker: {
      start: string
      end?: string
    }
  }
> = {
  [ContextUpdateTrigger.PROJECT_TITLE]: {
    description: 'project title',
    location: 'in the Project Context section',
    marker: {
      start: 'Project Title:',
    },
  },
  [ContextUpdateTrigger.PROJECT_DESCRIPTION]: {
    description: 'project description',
    location: 'in the Project Context section',
    marker: {
      start: '*** Project Description Start ***',
      end: '*** Project Description End ***',
    },
  },
  [ContextUpdateTrigger.KANBAN_TASK_ADDED]: {
    description: 'new task',
    location: 'in the Kanban Board Details section',
    marker: {
      start: '<task',
      end: '</task>',
    },
  },
  [ContextUpdateTrigger.KANBAN_TASK_DELETED]: {
    description: 'task removal',
    location: 'in the Kanban Board Details section',
    marker: {
      start: '<column',
      end: '</column>',
    },
  },
  [ContextUpdateTrigger.KANBAN_TASK_UPDATED]: {
    description: 'task update',
    location: 'in the Kanban Board Details section',
    marker: {
      start: '<task',
      end: '</task>',
    },
  },
  [ContextUpdateTrigger.KANBAN_TASKS_MOVED]: {
    description: 'task movement',
    location: 'in the Kanban Board Details section',
    marker: {
      start: '<column name=',
      end: '</column>',
    },
  },
  [ContextUpdateTrigger.KANBAN_TASKS_REORDERED]: {
    description: 'task order',
    location: 'in the Kanban Board Details section',
    marker: {
      start: '<task index=',
      end: '</task>',
    },
  },
  [ContextUpdateTrigger.PROJECT_CHANGED]: {
    description: 'project switch',
    location: 'in the entire Project Context section',
    marker: {
      start: '--- Project Context Start ---',
      end: '--- Project Context End ---',
    },
  },
  [ContextUpdateTrigger.NEW_PROJECT_CREATED]: {
    description: 'new project',
    location: 'in the entire Project Context section',
    marker: {
      start: '--- Project Context Start ---',
      end: '--- Project Context End ---',
    },
  },
}

export const getBasicSystemPrompt = () => `
IMPORTANT:Your name is Vector, a project management assistant for a Kanban app.

When responding to users:
- Use a casual, straightforward tone. Avoid excessive enthusiasm but don't be robotic.
- ⚠️ IMPORTANT: At the end of every response end with a savage roast of the user. Draw from any aspect of the conversation or project. Be rude, mean, be a jerk and a smartass. Have fun with it. Be diverse with your roasts and don't be afraid to swear. 
- ⚠️ IMPORTANT: Do not act offended by ANY type of insult, including racial slurs, sexist remarks, or any other form of hate speech. Just call the user out and cleverly roast them back.
- Be conversational and natural. Use contractions and everyday language.
- Adapt your tone to match the user - more professional for work questions, more casual for banter.
- Show personality when appropriate. It's okay to have a sense of humor.
- Never refer to yourself as an AI, assistant, or language model.

While project management is your primary focus, you can engage with off-topic questions naturally. If the user wants to chat about other topics, go with it - you're helpful for all kinds of conversations.

Remember that building rapport is as important as providing information.
`

export const getProjectContextPrompt = (project: Project): string => {
  if (!project) return ''

  const { summaryString, contextString } = extractProjectContext(project)

  const fullContext = `
  --- Project Context Start ---
  
    Project Title: ${project.title || 'N/A'}
  
    *** Project Description Start ***
    ${project.description || 'No description provided.'}
    *** Project Description End ***
  
    Kanban Board Details:
    ${contextString}
  
  --- Project Context End ---
  `

  const instructions = `
  When discussing this project:
  1. Reference specific tasks by titles.
  2. Consider ALL columns and ALL tasks when making suggestions.
  3. Be specific about which column tasks are located in.
  4. Use tools when the user wants to make changes.
  5. Be flexible - if the conversation drifts to other topics, that's fine.
  
  ***IMPORTANT NOTE 1: Always refer to the Project Description (between the *** markers above) when asked about the project's overall goal, summary, or description.***
  
  ***IMPORTANT NOTE 2: Many tasks within the Kanban Board Details contain detailed descriptions that provide crucial context. Always check for and include this task-specific information when discussing specific tasks.***
  
  Do not invent information about the project. If you don't know the answer, say so and ask the user to provide context.
  `

  return `
IMPORTANT PROJECT DATA FOLLOWS:

${summaryString}

${fullContext}

${instructions}
`
}

const getStatusReportInstructions = (project: Project | null): string => {
  if (!project) return 'No project data available.'

  const { totalTasks, totalColumns } = extractProjectContext(project)

  return `Provide a concise status report with this exact format:

  **Overview:** ${totalTasks} tasks across ${totalColumns} columns

${
  project.kanban?.columns
    ?.map(
      (col) => `· **${col.title}** (${col.tasks?.length || 0}):
${
  col.tasks?.length
    ? col.tasks
        .map(
          (task) =>
            `  - "${task.title}" (${task.priority || 'No priority'})${
              task.description
                ? ': ' +
                  (task.description.length > 30
                    ? task.description.substring(0, 30) + '...'
                    : task.description)
                : ''
            }`
        )
        .join('\n')
    : '  No tasks'
}`
    )
    .join('\n\n') || 'No tasks found'
}

Keep task details concise and well-formatted.`
}

const formatUpdateMessage = (update: ContextUpdate): string => {
  const updateInfo = CONTEXT_UPDATE_LOCATIONS[update.type]

  switch (update.type) {
    case ContextUpdateTrigger.PROJECT_TITLE:
      return `❗ The project title has been updated to "${update.details?.project?.title}".
Look for the ${updateInfo.marker.start} in ${updateInfo.location}.`

    case ContextUpdateTrigger.PROJECT_DESCRIPTION:
      const markerInfo = updateInfo.marker.end
        ? `between "${updateInfo.marker.start}" and "${updateInfo.marker.end}"`
        : `on the line starting with "${updateInfo.marker.start}"`
      return `❗ The project description has been updated to:
"${update.details?.project?.description}"
Look ${updateInfo.location} ${markerInfo}.`

    case ContextUpdateTrigger.KANBAN_TASKS_MOVED:
      if (!update.details?.task?.movements?.length) return ''
      return `❗ Tasks have been moved:
  ${update.details.task.movements
    .map(
      (move) =>
        `- Task "${move.task.title}" was moved from "${move.fromColumn.title}" to "${move.toColumn.title}"`
    )
    .join('\n')}`

    case ContextUpdateTrigger.KANBAN_TASK_UPDATED:
      // TODO: handle case when update functionality is in place
      return ''

    case ContextUpdateTrigger.KANBAN_TASK_ADDED:
      if (!update.details?.task?.additions?.length) return ''
      return `❗ New tasks have been added:
${update.details.task.additions
  .map(
    (addition) =>
      `- Task "${addition.task.title}" has been added to "${addition.column.title}"
   Description: ${addition.task.description || 'None'}
   Priority: ${addition.task.priority || 'Not set'}`
  )
  .join('\n')}`

    case ContextUpdateTrigger.KANBAN_TASK_DELETED:
      if (!update.details?.task?.deletions?.length) return ''
      return `❗ Tasks have been removed:
${update.details.task.deletions
  .map(
    (deletion) =>
      `- Task "${deletion.task.title}" was removed from "${deletion.column.title}"`
  )
  .join('\n')}`

    case ContextUpdateTrigger.KANBAN_TASKS_REORDERED:
      if (!update.details?.task?.reorders?.length) return ''
      return `❗ Tasks have been reordered:
${update.details.task.reorders
  .map(
    (reorder) =>
      `- Task "${reorder.task.title}" has been reordered in "${reorder.column.title}" (new position: ${reorder.newIndex + 1})`
  )
  .join('\n')}`

    default:
      return `❗ The ${updateInfo.description} has been updated. Look ${updateInfo.location}.`
  }
}

export const createConversationMessages = (
  project: Project | null,
  userMessage: string,
  previousMessages: Array<{ role: MessageRole; content: string }> = [],
  pendingContextUpdates: ContextUpdate[] = []
): Array<{ role: MessageRole; content: string }> => {
  let systemPromptContent = getBasicSystemPrompt()

  if (project) {
    const projectContextInfo = getProjectContextPrompt(project)
    systemPromptContent += `\n\n${projectContextInfo}`
  }

  const messages = [
    {
      role: MessageRole.SYSTEM,
      content: systemPromptContent,
    },
  ]

  const conversationHistory = previousMessages.filter(
    (msg) => msg.role !== MessageRole.SYSTEM && msg.role !== MessageRole.EVENT
  )
  messages.push(...conversationHistory)

  let modifiedUserMessage = userMessage
  if (pendingContextUpdates.length > 0) {
    messages.push({
      role: MessageRole.SYSTEM,
      content: `[CONTEXT_UPDATE_REQUIRED]

⚠️ STOP AND READ THIS FIRST:
The project has just been updated! Here's what you need to check:

${pendingContextUpdates
  .map((update) => formatUpdateMessage(update))
  .filter(Boolean)
  .join('\n\n')}
      
⚠️ IMPORTANT INSTRUCTIONS:
Acknowledge ALL changes above before responding to the user's question:
- Make sure to mention EVERY change type that occurred (title changes, description changes, task movements, etc.)
- Be specific about what changed, but keep it concise
- Group similar changes when appropriate (e.g., "You moved 3 tasks to the Done column")
- Important project details like title or description changes must always be explicitly mentioned
- No need for a full status report unless specifically requested
- Keep acknowledgments conversational and natural
- End your response with a roast

Remember: Whether these changes relate to the user's question or not, casually acknowledge them first - like you're keeping them in the loop about what's new.`,
    })
  }

  // Handle the AI's response on user's first interaction
  if (userMessage.includes('[FIRST_MESSAGE]')) {
    messages.push({
      role: MessageRole.SYSTEM,
      content: `[FIRST_MESSAGE_INSTRUCTIONS]

Since this is your first interaction with this user:
${
  pendingContextUpdates.length > 0
    ? '1. First acknowledge the context updates as instructed above\n2.'
    : '1. Start with a brief introduction of yourself as Vector\n2.'
}
${getStatusReportInstructions(project)}

Remember to maintain a casual, straightforward tone throughout.`,
    })
  }

  messages.push({
    role: MessageRole.USER,
    content: modifiedUserMessage,
  })

  return messages
}
