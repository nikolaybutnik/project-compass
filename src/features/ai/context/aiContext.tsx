import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import {
  getBasicSystemPrompt,
  createConversationMessages,
} from '@/features/ai/utils/promptTemplate'
import { Project } from '@/shared/types'
import { AIActionType, AIResponse } from '@/features/ai/types'
import { MessageRole } from '@/features/ai/types'
import { getChatResponse } from '@/features/ai/services/aiService'

interface AIContextState {
  messages: Array<{ role: MessageRole; content: string }>
  isLoading: boolean
  projectContext: Project | null
  sendMessage: (message: string) => Promise<AIResponse>
  resetContext: () => void
  updateProjectContext: (project: Project) => void
  invalidateContext: () => void
}

const AIContext = createContext<AIContextState | undefined>(undefined)

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // TODO: persist message history in cache and/or firebase?
  const [messages, setMessages] = useState<
    Array<{ role: MessageRole; content: string }>
  >([])
  const [isLoading, setIsLoading] = useState(false)
  const [projectContext, setProjectContext] = useState<Project | null>(null)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [contextVersion, setContextVersion] = useState(0)
  const [lastSentContextVersion, setLastSentContextVersion] = useState(0)

  // Memoize the basic system prompt to avoid regenerating it
  const basicSystemPrompt = useMemo(() => getBasicSystemPrompt(), [])

  useEffect(() => {
    setMessages([
      {
        role: MessageRole.SYSTEM,
        content: basicSystemPrompt,
      },
    ])
  }, [basicSystemPrompt])

  useEffect(() => {
    if (messages.length > 0 && messages[0].role === 'system') {
      setMessages((prev) => [
        {
          role: MessageRole.SYSTEM,
          content: basicSystemPrompt,
        },
        ...prev.slice(1), // Preserve conversation history
      ])
    }
  }, [projectContext?.id, basicSystemPrompt])

  // Invalidate the context when the project data is updated to force a refresh of context for AI
  const invalidateContext = useCallback(() => {
    // TODO: make sure invalidation triggers when moving tasks between columns
    setContextVersion((prev) => prev + 1)
  }, [])

  // Handle user message submission to AI
  const sendMessage = useCallback(
    async (message: string): Promise<AIResponse> => {
      setIsLoading(true)

      try {
        const isFirstUserMessage = !messages.some(
          (msg) => msg.role === MessageRole.USER
        )

        const displayMessage = {
          role: MessageRole.USER,
          content: message,
        }

        // [FIRST_MESSAGE] flag for AI to know if this is the start of conversation
        const userMessageContent = isFirstUserMessage
          ? `[FIRST_MESSAGE] ${message}`
          : message

        setMessages((prev) => [...prev, displayMessage])

        let apiMessages

        if (projectContext) {
          const needsContextRefresh = contextVersion > lastSentContextVersion

          const conversationMessages = createConversationMessages(
            projectContext,
            userMessageContent,
            messages,
            needsContextRefresh
          )

          apiMessages = conversationMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))

          if (needsContextRefresh) {
            setLastSentContextVersion(contextVersion)
          }
        } else {
          // For non-project conversations, preserve the conversation history
          apiMessages = [
            {
              role: MessageRole.SYSTEM,
              content: basicSystemPrompt,
            },
            ...messages.filter((msg) => msg.role !== MessageRole.SYSTEM),
            {
              role: MessageRole.USER,
              content: userMessageContent,
            },
          ]
        }

        const response = await getChatResponse(apiMessages, projectContext?.id)

        if (response.action && response.action.type !== AIActionType.NONE) {
          setContextVersion((prev) => prev + 1)
        }

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
    [messages, projectContext, basicSystemPrompt, contextVersion]
  )

  // Clear the message history and reset to the initial system prompt
  const resetContext = useCallback(() => {
    setMessages([
      {
        role: MessageRole.SYSTEM,
        content: basicSystemPrompt,
      },
    ])
    setContextVersion(0)
    setLastSentContextVersion(0)
  }, [basicSystemPrompt])

  const updateProjectContext = useCallback(
    (project: Project) => {
      const isNewProject = !projectContext || project.id !== projectContext.id

      if (isNewProject) {
        setContextVersion((prev) => prev + 1)

        if (!isFirstLoad) {
          setMessages((prev) => [
            prev[0], // Keep basic system prompt
            {
              role: MessageRole.EVENT,
              content: `Switched to project: ${project.title || project.id}`,
            },
          ])
        } else {
          setMessages([
            {
              role: MessageRole.SYSTEM,
              content: basicSystemPrompt,
            },
          ])

          setIsFirstLoad(false)
        }
      }

      setProjectContext(project)
    },
    [projectContext, basicSystemPrompt]
  )

  // Memoize the context value to prevent unnecessary re-renders
  const memoizedContextValue = useMemo(
    () => ({
      messages,
      isLoading,
      projectContext,
      sendMessage,
      resetContext,
      updateProjectContext,
      invalidateContext,
    }),
    [
      messages,
      isLoading,
      projectContext,
      sendMessage,
      resetContext,
      updateProjectContext,
      invalidateContext,
    ]
  )

  return (
    <AIContext.Provider value={memoizedContextValue}>
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
