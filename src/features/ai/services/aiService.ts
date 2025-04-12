import {
  AIResponse,
  AIActionType,
  MessageRole,
  ContextUpdateTrigger,
  ContextUpdate,
  ActionResult,
} from '@/features/ai/types'
import { getToolDefinitions } from '@/features/ai/utils/toolDefinitions'
import OpenAI from 'openai'
import {
  ChatCompletion,
  ChatCompletionMessageParam,
} from 'openai/resources/chat'
import { updateTitle } from '@/features/projects/services/projectsService'
import { QUERY_KEYS } from '@/shared/store/projectsStore'
import { QueryClient } from '@tanstack/react-query'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  // TODO: Weigh my options. Do I need to bring up a backend?
  dangerouslyAllowBrowser: true,
})

const FALLBACK_MESSAGE = "I've processed your request."

let queryClientRef: QueryClient

export const initializeQueryClientRef = (queryClient: QueryClient) => {
  queryClientRef = queryClient
}

const createErrorResponse = (error: any): AIResponse => ({
  message: `Sorry, there was a problem: ${error}`,
  action: { type: AIActionType.NONE, payload: { actions: [] } },
})

const createActionResponse = (
  message: string | null,
  actionResults: any[]
): AIResponse => ({
  message: message || FALLBACK_MESSAGE,
  action:
    actionResults.length === 1
      ? {
          type: actionResults[0].type,
          payload: { ...actionResults[0].args, actions: actionResults },
        }
      : {
          type: AIActionType.MULTIPLE,
          payload: { actions: actionResults },
        },
})

const mapToOpenAIMessages = (
  messages: Array<{ role: MessageRole; content: string }>
): ChatCompletionMessageParam[] => {
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

const handleTitleUpdateToolCall = async (
  projectId: string,
  newTitle: string,
  callback: (update: ContextUpdate) => void
) => {
  await updateTitle(projectId, newTitle)

  if (queryClientRef) {
    queryClientRef.setQueryData(
      [QUERY_KEYS.PROJECT, projectId],
      (old: any) => ({ ...old, title: newTitle })
    )

    queryClientRef.invalidateQueries({
      queryKey: [QUERY_KEYS.PROJECT, projectId],
    })

    queryClientRef.invalidateQueries({
      queryKey: [QUERY_KEYS.PROJECTS],
    })

    callback({
      type: ContextUpdateTrigger.PROJECT_TITLE,
      details: {
        project: {
          title: newTitle,
        },
      },
    })
  }

  return { success: true }
}

const requestAiResponse = (
  messages: ChatCompletionMessageParam[],
  model: string = 'gpt-4o-mini',
  tools = getToolDefinitions(),
  toolChoice: 'auto' | 'none' | 'required' = 'auto'
): Promise<ChatCompletion> => {
  return openai.chat.completions.create({
    model,
    messages,
    tools,
    tool_choice: toolChoice,
  })
}

const requestPostToolFollowUp = async (
  messages: Array<{ role: MessageRole; content: string }>,
  responseMessage: OpenAI.Chat.Completions.ChatCompletionMessage,
  actionResults: {
    type: AIActionType
    result: ActionResult
    args: any
  }[]
): Promise<AIResponse> => {
  try {
    const followUpMessages = [
      ...mapToOpenAIMessages(messages),
      {
        role: MessageRole.ASSISTANT,
        content: null,
        tool_calls: responseMessage?.tool_calls || [],
      },
    ]

    for (const [i, tool] of responseMessage?.tool_calls?.entries() || []) {
      const result = actionResults[i]
      let resultMessage: string

      switch (result.type) {
        case AIActionType.UPDATE_PROJECT_TITLE:
          resultMessage = `Project title updated to "${result.args.title}"`
          break

        default:
          resultMessage = result.result.success
            ? 'Operation completed successfully'
            : `Error: ${result.result.error}`
      }

      followUpMessages.push({
        role: MessageRole.TOOL,
        content: JSON.stringify({
          success: result.result.success,
          result: resultMessage,
        }),
        tool_call_id: tool.id,
      })
    }

    followUpMessages.push({
      role: MessageRole.SYSTEM,
      content:
        'Provide a conversational response acknowledging the changes made. Be friendly and concise.',
    })

    const followUpCompletion = await requestAiResponse(
      followUpMessages as ChatCompletionMessageParam[]
    )
    return createActionResponse(
      followUpCompletion.choices[0].message.content,
      actionResults
    )
  } catch (error) {
    return createErrorResponse(error)
  }
}

export const getChatResponse = async (
  messages: Array<{ role: MessageRole; content: string }>,
  projectId?: string,
  dependencies?: {
    invalidateContext?: (update: ContextUpdate) => void
  }
): Promise<AIResponse> => {
  try {
    const completion = await requestAiResponse(mapToOpenAIMessages(messages))
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
        let actionResult: ActionResult = { success: false }

        try {
          switch (actionType) {
            case AIActionType.UPDATE_PROJECT_TITLE:
              actionResult = await handleTitleUpdateToolCall(
                projectId,
                toolArgs.title,
                dependencies.invalidateContext
              )
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

      // Process tool calls and get follow-up response
      return await requestPostToolFollowUp(
        messages,
        responseMessage,
        actionResults
      )
    }

    // Return response for cases without tool calls
    return createActionResponse(responseMessage.content, [])
  } catch (error) {
    console.error('Error in AI service:', error)
    return createErrorResponse(error)
  }
}
