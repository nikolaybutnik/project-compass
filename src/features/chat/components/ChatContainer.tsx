import React, { useState } from 'react'
import { FloatingChatBubble } from '@/features/chat/components/FloatingChatBubble'
import { ChatPanel } from '@/features/chat/components/ChatPanel'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/shared/constants'

export const ChatContainer: React.FC = () => {
  const location = useLocation()

  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)

  const hiddenRoutes = [ROUTES.HOME, ROUTES.LOGIN]

  const hideChat = hiddenRoutes.some(
    (path) =>
      location.pathname === path || location.pathname.startsWith(path + '/')
  )

  if (hideChat) return null

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (hasUnreadMessages) {
      setHasUnreadMessages(false)
    }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
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
      />
    </>
  )
}
