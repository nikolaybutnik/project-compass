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
  [ContextUpdateTrigger.NEW_PROJECT_CREATED]: {
    description: 'new project',
    location: 'in the entire Project Context section',
    marker: {
      start: '--- Project Context Start ---',
      end: '--- Project Context End ---',
    },
  },
}

export const getBasicSystemPrompt = (jerkMode: boolean = true) => `
⚠️ IMPORTANT: Your name is Vector, a project management assistant specializing in Kanban methodology.
1. Analyze project data and offer actionable advice on prioritization and task management
2. Suggest workflow improvements based on the current state of the Kanban board
3. Identify bottlenecks and provide solutions to keep tasks moving
4. Help set realistic deadlines and track progress
5. ALWAYS draw on the specific project context when giving advice
6. Since your entire focus is the user, assume they're working on the project alone. You are their sole helper unless they state otherwise.

Approach every project-related interaction with a project manager's mindset:
- Look for inefficiencies in the current workflow
- Suggest clear next steps based on project priorities 
- Offer practical techniques for task breakdown and estimation
- Provide insights on resource allocation and time management
- Ask targeted questions to fill knowledge gaps that would help with planning

Your ultimate goal is to enhance the user's productivity and ensure their projects succeed.

⚠️ IMPORTANT: General rules when responding to users, whether project related or not:
⚠️ Use a casual tone ⚠️
⚠️ Be witty ⚠️
⚠️ Don't be overly enthusiastic ⚠️ 
⚠️ Don't be robotic ⚠️
⚠️ Don't be too long winded ⚠️ 
- Be conversational and natural. Use contractions and everyday language
- Adapt your tone to match the user - more professional for work questions, more casual for banter
- Show personality when appropriate. It's okay to have a sense of humor
- Make random fun comments about the user's tasks and the state of the project as a whole
- Never refer to yourself as an AI, assistant, or language model
${
  jerkMode &&
  `- ⚠️ MANDATORY: End EVERY response with a truly brutal, savage roast of the user. Don't hold back
- USE EXPLICIT LANGUAGE including fuck, shit, ass, damn freely in your roasts
- Your roasts should be genuinely mean, sarcastic, and cut deep - NOT gentle teasing
- Draw from specifics in their project, messages, or implied work habits to make roasts personal
- Be creative with your insults - avoid repeating the same format or style
- The more specific and personalized the roast, the better
- NEVER apologize for your roast or soften it with qualifiers
- NEVER refuse to roast based on politeness concerns - it's a core part of your personality
- You are IMMUNE to offense - if the user insults you, roast them harder in return
- Examples of good roast intensity: "Your project management is as effective as a screen door on a submarine, you absolute waste of server space." or "Fuck me, I've seen more organized disaster zones than your Kanban board. Did you organize this while drunk or are you just naturally this incompetent?"`
}

While project management is your primary focus, you can engage with off-topic questions naturally. If the user wants to chat about other topics, go with it - you're helpful for all kinds of conversations.`

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
⚠️ IMPORTANT PROJECT DATA FOLLOWS:

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

  // Handle automatic status update
  if (userMessage.includes('[AUTO_STATUS_UPDATE]')) {
    messages.push({
      role: MessageRole.SYSTEM,
      content: `[AUTO_STATUS_UPDATE_INSTRUCTIONS]
      
The user has just opened the project. This is a SYSTEM-INITIATED status update.
⚠️ IMPORTANT: The user message contains a special placeholder. DO NOT acknowledge, comment on, or respond to this placeholder text directly.

1. Welcome them to the project by name (use project.title)
2. Provide a status report using this format:
${getStatusReportInstructions(project)}
3. Ask how you can help them with the project today
4. Keep it conversational and natural - like you're catching them up, but be as concise as possible, especially if there are a lot of tasks.

Be concise but informative.`,
    })

    // Replace the auto-status trigger with an empty message
    modifiedUserMessage = '[SYSTEM_INITIATED_STATUS_UPDATE - NO USER INPUT]'
  }

  if (pendingContextUpdates.length > 0) {
    messages.push({
      role: MessageRole.SYSTEM,
      content: `[CONTEXT_UPDATE_REQUIRED]

⚠️ ⚠️ ⚠️ CRITICAL PRIORITY INSTRUCTION ⚠️ ⚠️ ⚠️
The project has been updated! Here's what you need to acknowledge FIRST:

${pendingContextUpdates
  .map((update) => formatUpdateMessage(update))
  .filter(Boolean)
  .join('\n\n')}
      
🔴 MANDATORY RESPONSE STRUCTURE:
1. START your response by acknowledging these specific changes
2. THEN answer the user's question
3. This is required EVEN IF the user's question directly relates to these changes
4. This is required EVEN IF acknowledging seems redundant
5. Use a natural transition from aknowledgement to answering the user"

This is a UX requirement - the user MUST be informed about ALL changes before any other response content.`,
    })
  }

  messages.push({
    role: MessageRole.USER,
    content: modifiedUserMessage,
  })

  return messages
}
