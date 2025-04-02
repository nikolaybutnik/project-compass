import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { getSystemPrompt } from '@/features/ai/utils/promptTemplate'
import { Project } from '@/shared/types'
import { AIResponse } from '@/features/ai/types'
import { MessageRole } from '@/features/ai/types'
import { getChatResponse } from '@/features/ai/services/aiService'

interface AIContextState {
  messages: Array<{ role: MessageRole; content: string }>
  isLoading: boolean
  projectContext: Project | null
  sendMessage: (message: string) => Promise<AIResponse>
  resetContext: () => void
  updateProjectContext: (project: Project) => void
}

const AIContext = createContext<AIContextState | undefined>(undefined)

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // TODO: persist message history in cache?
  const [messages, setMessages] = useState<
    Array<{ role: MessageRole; content: string }>
  >([])
  const [isLoading, setIsLoading] = useState(false)
  const [projectContext, setProjectContext] = useState<Project | null>(null)

  useEffect(() => {
    setMessages([
      {
        role: MessageRole.SYSTEM,
        content: getSystemPrompt(projectContext?.id || ''),
      },
    ])
  }, [])

  useEffect(() => {
    if (messages.length > 0 && messages[0].role === 'system') {
      setMessages((prev) => [
        {
          role: MessageRole.SYSTEM,
          content: getSystemPrompt(projectContext?.id || ''),
        },
        ...prev.slice(1), // Preserve conversation history
      ])
    }
  }, [projectContext?.id])

  // Handle user message submission to AI
  const sendMessage = useCallback(
    async (message: string): Promise<AIResponse> => {
      setIsLoading(true)

      try {
        const updatedMessages = [
          ...messages,
          { role: MessageRole.USER, content: message },
        ]
        setMessages(updatedMessages)

        const response = await getChatResponse(
          updatedMessages,
          projectContext?.id
        )

        setMessages((prev) => [
          ...prev,
          { role: MessageRole.ASSISTANT, content: response.message },
        ])

        return response
      } catch (error) {
        console.error('Error in AI chat:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [messages, projectContext]
  )

  // Clear the message history and reset to the initial system prompt
  const resetContext = useCallback(() => {
    setMessages([
      {
        role: MessageRole.SYSTEM,
        content: getSystemPrompt(projectContext?.id || ''),
      },
    ])
  }, [projectContext])

  const updateProjectContext = useCallback(
    (project: Project) => {
      setProjectContext(project)

      if (projectContext && project.id !== projectContext.id) {
        setMessages((prev) => [
          ...prev,
          {
            role: MessageRole.EVENT,
            content: `Switched to project: ${project.title || project.id}`,
          },
        ])
      }
    },
    [projectContext]
  )

  return (
    <AIContext.Provider
      value={{
        messages,
        isLoading,
        projectContext,
        sendMessage,
        resetContext,
        updateProjectContext,
      }}
    >
      {children}
    </AIContext.Provider>
  )
}

export const useAI = (): AIContextState => {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider')
  }
  return context
}
