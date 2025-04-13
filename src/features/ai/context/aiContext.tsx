import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react'
import {
  getBasicSystemPrompt,
  createConversationMessages,
} from '@/features/ai/utils/promptTemplate'
import { Project } from '@/shared/types'
import {
  AIResponse,
  ContextUpdate,
  ContextUpdateTrigger,
} from '@/features/ai/types'
import { MessageRole } from '@/features/ai/types'
import { getChatResponse } from '@/features/ai/services/aiService'

/* 
AI MESSAGE ARCHITECTURE

messages (UI state)
    ↓
conversationMessages (adds context & system prompts)
    ↓
apiMessages (formatted for API)
    ↓
AI response
    ↓
back to messages (UI state)
*/

interface AIContextState {
  messages: Array<{ role: MessageRole; content: string }>
  isLoading: boolean
  projectContext: Project | null
  sendMessage: (message: string) => Promise<AIResponse>
  updateProjectContext: (project: Project) => void
  invalidateContext: (updateType: ContextUpdate) => void
  resetContext: () => void
  refreshContext: () => void
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
  const [pendingContextUpdates, setPendingContextUpdates] = useState<
    ContextUpdate[]
  >([])

  // Memoize the basic system prompt to avoid regenerating it
  const basicSystemPrompt = useMemo(() => getBasicSystemPrompt(), [])

  // Invalidate the context when the project data is updated to force a refresh of context for AI
  const invalidateContext = useCallback((update: ContextUpdate) => {
    setPendingContextUpdates((prev) => {
      // Find if there's an existing update of teh same type
      const existingUpdateIndex = prev.findIndex((p) => p.type === update.type)

      if (existingUpdateIndex === -1) {
        return [...prev, update]
      }

      const existingUpdate = prev[existingUpdateIndex]
      const mergedUpdate: ContextUpdate = {
        type: update.type,
        details: {
          task: {
            movements: [
              ...(existingUpdate.details?.task?.movements || []),
              ...(update.details?.task?.movements || []),
            ],
            additions: [
              ...(existingUpdate.details?.task?.additions || []),
              ...(update.details?.task?.additions || []),
            ],
            deletions: [
              ...(existingUpdate.details?.task?.deletions || []),
              ...(update.details?.task?.deletions || []),
            ],
            reorders: [
              ...(existingUpdate.details?.task?.reorders || []),
              ...(update.details?.task?.reorders || []),
            ],
          },
          project: {
            ...existingUpdate.details?.project,
            ...update.details?.project,
          },
        },
      }

      const newUpdates = [...prev]
      newUpdates[existingUpdateIndex] = mergedUpdate
      return newUpdates
    })
  }, [])

  // Manually send fresh context to AI if it loses track.
  const refreshContext = useCallback(async () => {
    setMessages((prev) => [
      ...prev,
      {
        role: MessageRole.EVENT,
        content: 'Context refreshed with latest project data.',
      },
    ])
    if (projectContext) {
      setIsLoading(true)

      try {
        const refreshMessage =
          '[SYSTEM_REFRESH_CONTEXT] Confirm that you have received the latest project data, and give a status update.'
        const conversationMessages = createConversationMessages(
          projectContext,
          refreshMessage,
          messages
        )
        const apiMessages = conversationMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        const response = await getChatResponse(apiMessages, projectContext.id)
        setMessages((prev) => [
          ...prev,
          { role: MessageRole.ASSISTANT, content: response.message },
        ])
      } catch (error) {
        console.error('Error refreshing context:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }, [projectContext])

  // Handle user message submission to AI
  const sendMessage = useCallback(
    async (message: string): Promise<AIResponse> => {
      setIsLoading(true)

      try {
        const isAutoStatusUpdate = message.includes('[AUTO_STATUS_UPDATE]')

        if (!isAutoStatusUpdate) {
          const displayMessage = {
            role: MessageRole.USER,
            content: message,
          }
          setMessages((prev) => [...prev, displayMessage])
        }

        const apiMessages = createConversationMessages(
          projectContext, // This can be null for non-project conversations
          message,
          messages,
          pendingContextUpdates
        )
        const response = await getChatResponse(
          apiMessages,
          projectContext?.id,
          { invalidateContext }
        )

        setPendingContextUpdates([])
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
    [messages, projectContext, pendingContextUpdates]
  )

  // Clear the message history and reset to the initial system prompt
  const resetContext = useCallback(() => {
    setMessages([
      {
        role: MessageRole.SYSTEM,
        content: basicSystemPrompt,
      },
    ])
    setPendingContextUpdates([])
  }, [basicSystemPrompt])

  const updateProjectContext = useCallback(
    (project: Project) => {
      const isNewProject = !projectContext || project.id !== projectContext.id

      if (isNewProject) {
        if (!isFirstLoad) {
          setPendingContextUpdates([])

          setMessages((prev) => [
            ...prev, // Keep existing conversation
            {
              role: MessageRole.EVENT,
              content: `[SYSTEM_PROJECT_SWITCH]
              ===AI_INSTRUCTIONS===
              The user has switched from project "${projectContext?.title || 'None'}" to project "${project.title}". 
              Maintain conversation continuity but be aware that context has changed to a new project.
              Aknowledge the change in your status report.
              ===DISPLAY_TEXT===
              Switched to project: ${project.title}`,
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
    [projectContext, basicSystemPrompt, invalidateContext]
  )

  // Memoize the context value to prevent unnecessary re-renders
  const memoizedContextValue = useMemo(
    () => ({
      messages,
      isLoading,
      projectContext,
      sendMessage,
      updateProjectContext,
      invalidateContext,
      resetContext,
      refreshContext,
    }),
    [
      messages,
      isLoading,
      projectContext,
      sendMessage,
      updateProjectContext,
      invalidateContext,
      resetContext,
      refreshContext,
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
