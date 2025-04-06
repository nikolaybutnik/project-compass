import { Project } from '@/shared/types'
import { extractProjectContext } from '@/features/ai/utils/projectContextHandler'

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
- For each column give the number of tasks and the priorities of the tasks


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
): { role: string; content: string } | undefined => {
  if (!project) return undefined

  const { contextString } = extractProjectContext(project)

  return {
    role: 'user',
    content: `[PROJECT_CONTEXT]\n${contextString}\n[END_PROJECT_CONTEXT]`,
  }
}

export const createConversationMessages = (
  project: Project,
  userMessage: string
) => {
  const messages = [
    {
      role: 'system',
      content: getBasicSystemPrompt(),
    },
  ]

  if (project) {
    const contextMessage = getProjectContextAsUserMessage(project)
    if (contextMessage) {
      messages.push(contextMessage)

      messages.push({
        role: 'assistant',
        content: `I understand the project context. I'll keep all task details including descriptions in mind when answering your questions.`,
      })
    }
  }

  messages.push({
    role: 'user',
    content: userMessage,
  })

  return messages
}
