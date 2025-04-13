import React, { useEffect, useState } from 'react'
import { FloatingChatBubble } from '@/features/chat/components/FloatingChatBubble'
import { ChatPanel } from '@/features/chat/components/ChatPanel'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/shared/constants'
import { ChatMessage } from '@/features/chat/types'
import { v4 as uuidv4 } from 'uuid'
import { MessageRole } from '@/features/ai/types'

export const ChatContainer: React.FC = () => {
  const location = useLocation()

  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const hiddenRoutes = [ROUTES.HOME, ROUTES.LOGIN]

  const hideChat = hiddenRoutes.some(
    (path) =>
      location.pathname === path || location.pathname.startsWith(path + '/')
  )

  if (hideChat) return null

  // Placeholder message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: uuidv4(),
          role: MessageRole.ASSISTANT,
          content:
            "Hello! I'm Vector, your project assistant. How can I help you today?",
          timestamp: new Date(),
        },
      ])
    }
  }, [])

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (hasUnreadMessages) {
      setHasUnreadMessages(false)
    }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: MessageRole.USER,
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Mock AI response (we'll replace this with actual AI call later)
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: MessageRole.ASSISTANT,
        content: `I received your message: "${content}". I'll help you with that soon!`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

      // If chat is closed, show unread indicator
      if (!isOpen) {
        setHasUnreadMessages(true)
      }
    }, 1000)
  }

  return (
    <>
      <FloatingChatBubble
        onClick={toggleChat}
        hasUnreadMessages={hasUnreadMessages}
      />
      <ChatPanel
        isOpen={isOpen}
        onClose={toggleChat}
        onExpand={toggleExpand}
        isExpanded={isExpanded}
        messages={messages}
        onSendMessage={handleSendMessage}
      />
    </>
  )
}
