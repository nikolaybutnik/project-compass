import React, { useEffect, useRef, useState } from 'react'
import { FloatingChatBubble } from '@/features/chat/components/FloatingChatBubble'
import { ChatPanel } from '@/features/chat/components/ChatPanel'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/shared/constants'
import { ChatMessage } from '@/features/chat/types'
import { MessageRole } from '@/features/ai/types'
import { useAI } from '@/features/ai/context/aiContext'

export const ChatContainer: React.FC = () => {
  const newMessageRef = useRef(false)
  const lastSeenMessageCount = useRef(0)
  const justOpenedRef = useRef(false)

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
    // If chat is open and we get new messages, mark them as seen
    if (isOpen && messages.length > 0) {
      lastSeenMessageCount.current = messages.length
    }
  }, [messages, isOpen])

  useEffect(() => {
    if (aiMessages.length) {
      const formattedMessages = aiMessages
        .filter((msg) => msg.role !== MessageRole.SYSTEM)
        .map((msg) => {
          if (
            msg.role !== MessageRole.EVENT ||
            !msg.content.includes('===DISPLAY_TEXT===')
          ) {
            return {
              role: msg.role,
              content: msg.content,
              timestamp: new Date(),
            }
          }

          const parts = msg.content.split('===DISPLAY_TEXT===')
          const displayText = parts.length > 1 ? parts[1].trim() : msg.content

          return {
            role: msg.role,
            content: displayText,
            timestamp: new Date(),
          }
        })

      setMessages(formattedMessages)

      // If chat is closed and there's a new AI message, show unread indicator
      const lastMessage = aiMessages[aiMessages.length - 1]
      if (
        !isOpen &&
        lastMessage?.role === MessageRole.ASSISTANT &&
        formattedMessages.length > lastSeenMessageCount.current
      ) {
        setHasUnreadMessages(true)
      }
    }
  }, [aiMessages, isOpen])

  useEffect(() => {
    setIsTyping(aiLoading)
  }, [aiLoading])

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        justOpenedRef.current = false
      }, 100)
      return () => clearTimeout(timer)
    }
    return
  }, [isOpen])

  const toggleChat = () => {
    const opening = !isOpen
    setIsOpen(opening)

    if (opening) {
      justOpenedRef.current = true
      setHasUnreadMessages(false)
      lastSeenMessageCount.current = messages.length
    }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleSendMessage = async (content: string) => {
    try {
      newMessageRef.current = true
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
        instantScroll={justOpenedRef.current}
      />
    </>
  )
}
