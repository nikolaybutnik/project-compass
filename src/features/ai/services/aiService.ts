import { AIResponse, AIActionType, MessageRole } from '@/features/ai/types'
import {
  getToolDefinitions,
  toolToActionMap,
} from '@/features/ai/utils/toolDefinitions'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  // TODO: Weigh my options. Do I need to bring up a backend?
  dangerouslyAllowBrowser: true,
})

function mapToOpenAIMessages(
  messages: Array<{ role: MessageRole; content: string }>
): ChatCompletionMessageParam[] {
  return messages
    .filter((msg) => msg.role !== 'event')
    .map((msg) => {
      return {
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      }
    })
}

export const getChatResponse = async (
  messages: Array<{ role: MessageRole; content: string }>,
  projectId?: string
): Promise<AIResponse> => {
  try {
    const tools = getToolDefinitions()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: mapToOpenAIMessages(messages),
      tools: tools,
      tool_choice: 'auto',
    })
    const responseMessage = completion.choices[0].message

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0]
      const toolName = toolCall.function.name
      const toolArguments = JSON.parse(toolCall.function.arguments)

      const actionType = toolToActionMap[toolName] || AIActionType.NONE

      let fallbackMessage = ''
      switch (toolName) {
        case AIActionType.CREATE_TASK.toLowerCase():
          fallbackMessage = `I'll create a task${toolArguments.title ? ` called "${toolArguments.title}"` : ''} for you.`
          break
        case AIActionType.UPDATE_TASK.toLowerCase():
          fallbackMessage = `I'll update that task for you.`
          break
        case AIActionType.DELETE_TASK.toLowerCase():
          fallbackMessage = `I'll delete that task for you.`
          break
        default:
          fallbackMessage = "I'll take care of that for you."
      }

      return {
        message: responseMessage.content || fallbackMessage,
        action: {
          type: actionType,
          payload: toolArguments,
        },
      }
    }

    return {
      message:
        responseMessage.content ||
        "I'm not sure I understand, can you please explain in more detail?",
      action: {
        type: AIActionType.NONE,
      },
    }
  } catch (error) {
    console.error('Error in AI service:', error)
    return {
      message: 'Sorry, there was a problem! Please try again.',
      action: { type: AIActionType.NONE },
    }
  }
}
