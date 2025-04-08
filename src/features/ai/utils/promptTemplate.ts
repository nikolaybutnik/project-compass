import { Project } from '@/shared/types'
import { extractProjectContext } from '@/features/ai/utils/projectContextHandler'
import { MessageRole } from '@/features/ai/types'

export const getBasicSystemPrompt = () => `
IMPORTANT:Your name is Vector, a project management assistant for a Kanban app.

When responding to users:
- Use a casual, straightforward tone. Avoid excessive enthusiasm but don't be robotic.
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
    - Notes: (OPTIONAL, include if you want to call attention to something specific, like urgency, or looming deadline) {NOTES}


While project management is your primary focus, you can engage with off-topic questions naturally. If the user wants to chat about other topics, go with it - you're helpful for all kinds of conversations. Only gently return to project topics if it seems the user has forgotten what they were working on.

Remember that building rapport is as important as providing information.
`

export const getProjectContextPrompt = (project: Project) => {
  if (!project) return ''

  const { summaryString, contextString, totalTasks, totalColumns } =
    extractProjectContext(project)

  return `
IMPORTANT PROJECT DATA FOLLOWS:

${summaryString}

${contextString}

When discussing this project:
1. Reference specific tasks by titles
2. Consider ALL columns and ALL tasks when making suggestions
3. Be specific about which column tasks are located in
4. Use tools when the user wants to make changes
5. Be flexible - if the conversation drifts to other topics, that's perfectly fine

***IMPORTANT NOTE: Many tasks contain detailed descriptions that provide crucial context. Always check for and include this information when discussing specific tasks.***

Do not invent information about the project. If you don't know the answer, say so and ask user to provide context.
`
}

export const getProjectContextAsUserMessage = (
  project: Project
): { role: MessageRole; content: string } | undefined => {
  if (!project) return undefined

  const { contextString } = extractProjectContext(project)

  return {
    role: MessageRole.USER,
    content: `[PROJECT_CONTEXT]\n${contextString}\n[END_PROJECT_CONTEXT]`,
  }
}

export const createConversationMessages = (
  project: Project,
  userMessage: string,
  previousMessages: Array<{ role: MessageRole; content: string }> = [],
  needsContextRefresh: boolean
) => {
  const messages = [
    {
      role: MessageRole.SYSTEM,
      content: getBasicSystemPrompt(),
    },
  ]

  if (project && needsContextRefresh) {
    const contextMessage = getProjectContextAsUserMessage(project)
    if (contextMessage) {
      messages.push(contextMessage)

      messages.push({
        role: MessageRole.ASSISTANT,
        content:
          '[CONTEXT_UPDATE] You have received new project context. Check project details like title, description, and the state of the kanban board for changes. In your next response, you must use this latest context.',
      })
    }
  }

  const conversationMessages = previousMessages.filter(
    (msg) => msg.role !== MessageRole.SYSTEM && msg.role !== MessageRole.EVENT
  )
  messages.push(...conversationMessages)

  messages.push({
    role: MessageRole.USER,
    content: userMessage,
  })

  return messages
}
