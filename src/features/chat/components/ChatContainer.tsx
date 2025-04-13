import React, { useEffect, useState } from 'react'
import { FloatingChatBubble } from '@/features/chat/components/FloatingChatBubble'
import { ChatPanel } from '@/features/chat/components/ChatPanel'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/shared/constants'
import { ChatMessage } from '@/features/chat/types'
import { v4 as uuidv4 } from 'uuid'
import { MessageRole } from '@/features/ai/types'
import { useAI } from '@/features/ai/context/aiContext'

export const ChatContainer: React.FC = () => {
  const location = useLocation()
  const { sendMessage, messages: aiMessages, isLoading: aiLoading } = useAI()

  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)

  const hiddenRoutes = [ROUTES.HOME, ROUTES.LOGIN]

  const hideChat = hiddenRoutes.some(
    (path) =>
      location.pathname === path || location.pathname.startsWith(path + '/')
  )

  useEffect(() => {
    if (aiMessages.length) {
      const formattedMessages = aiMessages
        .filter(
          (msg) =>
            msg.role === MessageRole.USER || msg.role === MessageRole.ASSISTANT
        )
        .map((msg) => ({
          id: uuidv4(),
          role: msg.role,
          content: msg.content,
          timestamp: new Date(),
        }))

      setMessages(formattedMessages)

      // If chat is closed and there's a new AI message, show unread indicator
      const lastMessage = aiMessages[aiMessages.length - 1]
      if (
        !isOpen &&
        lastMessage &&
        lastMessage.role === MessageRole.ASSISTANT
      ) {
        setHasUnreadMessages(true)
      }
    }
  }, [aiMessages, isOpen])

  useEffect(() => {
    setIsTyping(aiLoading)
  }, [aiLoading])

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (hasUnreadMessages) {
      setHasUnreadMessages(false)
    }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  if (hideChat) return null

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
        isTyping={isTyping}
      />
    </>
  )
}
