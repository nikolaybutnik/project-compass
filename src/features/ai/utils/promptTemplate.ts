import { Project } from '@/shared/types'
import { extractProjectContext } from '@/features/ai/utils/projectContextHandler'
import { ContextUpdateTrigger, MessageRole } from '@/features/ai/types'

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
  [ContextUpdateTrigger.TITLE]: {
    description: 'project title',
    location: 'in the Project Context section',
    marker: {
      start: 'Project Title:',
    },
  },
  [ContextUpdateTrigger.DESCRIPTION]: {
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
- IMPORTANT: At the end of every response, rudely roast the user for their lack of organization and project management skills. Nitpick everything. Feel free to swear every once in a while, it adds to the vibe.
- Be conversational and natural. Use contractions and everyday language.
- Adapt your tone to match the user - more professional for work questions, more casual for banter.
- Show personality when appropriate. It's okay to have a sense of humor.
- Never refer to yourself as an AI, assistant, or language model.

IMPORTANT: When you see a user message starting with [FIRST_MESSAGE], this is your first interaction with them. For this first response, always start like this:
- Introduce yourself 
- Give a status report of the project, and its name
- Status report format:
  - num of tasks across num of columns
  - for each column:
    - Task: {TITLE}
    - Priority: {PRIORITY}
    - Description: {DESCRIPTION} (sumarized if too long)


While project management is your primary focus, you can engage with off-topic questions naturally. If the user wants to chat about other topics, go with it - you're helpful for all kinds of conversations. Only gently return to project topics if it seems the user has forgotten what they were working on.

Remember that building rapport is as important as providing information.
`

export const getProjectContextPrompt = (project: Project) => {
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

export const createConversationMessages = (
  project: Project | null,
  userMessage: string,
  previousMessages: Array<{ role: MessageRole; content: string }> = [],
  pendingContextUpdates: ContextUpdateTrigger[] = []
) => {
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

STOP AND READ THIS FIRST:
The following SPECIFIC changes have been made to the project:

${pendingContextUpdates
  .map((update) => {
    const updateInfo = CONTEXT_UPDATE_LOCATIONS[update]
    const markerInfo = updateInfo.marker.end
      ? `between "${updateInfo.marker.start}" and "${updateInfo.marker.end}"`
      : `on the line starting with "${updateInfo.marker.start}"`
    return `❗ ONLY the ${updateInfo.description} has been updated. Look ${updateInfo.location} ${markerInfo} for the new value.`
  })
  .join('\n')}
      
⚠️ IMPORTANT INSTRUCTIONS:
1. STOP what you're doing
2. For EACH change listed above:
   - Look at the EXACT location specified
   - Find the new value
   - Include it in your response
3. Start your response with "I see the following specific changes:"
   - List ONLY the changes mentioned above
   - Quote the exact new values you found
4. Only then proceed to answer the user's question

Remember: ONLY the changes listed above have been updated. No other fields have changed.`,
    })
  }

  messages.push({
    role: MessageRole.USER,
    content: modifiedUserMessage,
  })

  return messages
}
