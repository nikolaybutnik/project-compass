import {
  AIResponse,
  AIActionType,
  MessageRole,
  ContextUpdateTrigger,
  ContextUpdate,
} from '@/features/ai/types'
import { getToolDefinitions } from '@/features/ai/utils/toolDefinitions'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { updateTitle } from '@/features/projects/services/projectsService'
import { QUERY_KEYS } from '@/shared/store/projectsStore'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  // TODO: Weigh my options. Do I need to bring up a backend?
  dangerouslyAllowBrowser: true,
})

let queryClientRef: any = null

export const initializeQueryClientRef = (queryClient: any) => {
  queryClientRef = queryClient
}

function mapToOpenAIMessages(
  messages: Array<{ role: MessageRole; content: string }>
): ChatCompletionMessageParam[] {
  return messages
    .filter(
      (msg) =>
        msg.role !== MessageRole.EVENT &&
        msg.role !== MessageRole.FUNCTION &&
        msg.role !== MessageRole.TOOL
    )
    .map((msg) => {
      return {
        role: msg.role as
          | MessageRole.SYSTEM
          | MessageRole.USER
          | MessageRole.ASSISTANT,
        content: msg.content,
      }
    })
}

export const getChatResponse = async (
  messages: Array<{ role: MessageRole; content: string }>,
  projectId?: string,
  dependencies?: {
    invalidateContext?: (update: ContextUpdate) => void
  }
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

    // Handle tool calls
    if (
      responseMessage.tool_calls &&
      projectId &&
      dependencies?.invalidateContext
    ) {
      const actionResults = []

      for (const tool of responseMessage.tool_calls) {
        const toolArgs = JSON.parse(tool.function.arguments)
        const actionType = tool.function.name as AIActionType
        let actionResult = null

        try {
          switch (actionType) {
            case AIActionType.UPDATE_PROJECT_TITLE:
              await updateTitle(projectId, toolArgs.title)

              if (queryClientRef) {
                queryClientRef.setQueryData(
                  [QUERY_KEYS.PROJECT, projectId],
                  (old: any) => ({ ...old, title: toolArgs.title })
                )

                queryClientRef.invalidateQueries({
                  queryKey: [QUERY_KEYS.PROJECT, projectId],
                })

                queryClientRef.invalidateQueries({
                  queryKey: [QUERY_KEYS.PROJECTS],
                })

                dependencies.invalidateContext({
                  type: ContextUpdateTrigger.PROJECT_TITLE,
                  details: {
                    project: {
                      title: toolArgs.title,
                    },
                  },
                })
              }

              actionResult = { success: true }
              break

            default:
              actionResult = { success: false, error: 'Unknown tool call' }
          }
        } catch (error) {
          console.error(`Error executing ${actionType}:`, error)
          actionResult = { success: false, error: String(error) }
        }

        actionResults.push({
          type: actionType,
          result: actionResult,
          args: toolArgs,
        })
      }

      const fallbackMessage = "I've processed your request."

      if (actionResults.length === 1) {
        return {
          message: responseMessage.content || fallbackMessage,
          action: {
            type: actionResults[0].type,
            payload: {
              ...actionResults[0].args,
              actions: actionResults,
            },
          },
        }
      } else {
        return {
          message: responseMessage.content || fallbackMessage,
          action: {
            type: AIActionType.MULTIPLE,
            payload: { actions: actionResults },
          },
        }
      }
    }

    // Return response for cases without tool calls
    return {
      message: responseMessage.content || "I don't have a response for that.",
      action: {
        type: AIActionType.NONE,
        payload: { actions: [] },
      },
    }
  } catch (error) {
    console.error('Error in AI service:', error)
    return {
      message: 'Sorry, there was a problem! Please try again.',
      action: {
        type: AIActionType.NONE,
        payload: { actions: [] },
      },
    }
  }
}
