import { AIResponse, AIActionType, MessageRole } from '@/features/ai/types'
import { getToolDefinitions } from '@/features/ai/utils/toolDefinitions'

export const getChatResponse = async (
  messages: Array<{ role: string; content: string }>,
  projectId?: string
): Promise<AIResponse> => {
  try {
    return {
      message: 'Message recieved, boss. This is a placeholder response.',
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
