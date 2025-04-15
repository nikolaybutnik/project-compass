import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChatPanel } from '@/features/chat/components/ChatPanel'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/shared/constants'
import { ChatMessage } from '@/features/chat/types'
import { MessageRole } from '@/features/ai/types'
import { useAI } from '@/features/ai/context/aiContext'
import {
  DndContext,
  useSensors,
  useSensor,
  PointerSensor,
  DragEndEvent,
} from '@dnd-kit/core'
import { withMargin } from '../utils/modifiers'
import { extraMargins } from '../constants'
import { DraggableChatBubble } from './DraggableChatBubble'
import { debounce } from 'lodash'

export const ChatContainer: React.FC = () => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  )

  const newMessageRef = useRef(false)
  const lastSeenMessageCount = useRef(0)
  const justOpenedRef = useRef(false)
  const bubbleRef = useRef<HTMLDivElement | null>(null)

  const location = useLocation()
  const { sendMessage, messages: aiMessages, isLoading: aiLoading } = useAI()

  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [bubblePosition, setBubblePosition] = useState({
    x: 20, // 20px from right
    y: 20, // 20px from bottom
  })

  const hiddenRoutes = [ROUTES.HOME, ROUTES.LOGIN]

  const hideChat = useMemo(
    () =>
      hiddenRoutes.some(
        (path) =>
          location.pathname === path || location.pathname.startsWith(path + '/')
      ),
    [location.pathname]
  )

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      lastSeenMessageCount.current = messages.length
    }
    if (isOpen) {
      const timer = setTimeout(() => {
        justOpenedRef.current = false
      }, 100)
      return () => clearTimeout(timer)
    }
    return
  }, [isOpen, messages])

  useEffect(() => {
    setIsTyping(aiLoading)
  }, [aiLoading])

  useEffect(() => {
    const updatePositionOnResize = debounce(() => {
      if (bubbleRef.current) {
        const rect = bubbleRef.current.getBoundingClientRect()
        const maxX = window.innerWidth - rect.width - extraMargins.right
        const maxY = window.innerHeight - rect.height - extraMargins.bottom

        setBubblePosition((prev) => ({
          x: Math.min(prev.x, maxX),
          y: Math.min(prev.y, maxY),
        }))
      }
    }, 100)

    updatePositionOnResize()
    window.addEventListener('resize', updatePositionOnResize)
    return () => {
      window.removeEventListener('resize', updatePositionOnResize)
      updatePositionOnResize.cancel()
    }
  }, [bubbleRef, setBubblePosition])

  const formattedMessages = useMemo(() => {
    return aiMessages
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
  }, [aiMessages])

  useEffect(() => {
    if (formattedMessages?.length) {
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
  }, [formattedMessages, aiMessages, isOpen])

  const toggleChat = useCallback(() => {
    const opening = !isOpen
    setIsOpen(opening)

    if (opening) {
      justOpenedRef.current = true
      setHasUnreadMessages(false)
      lastSeenMessageCount.current = messages.length
    }
  }, [isOpen, messages.length])

  const toggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded)
  }, [isExpanded])

  const handleSendMessage = useCallback(
    async (content: string) => {
      try {
        newMessageRef.current = true
        await sendMessage(content)
      } catch (error) {
        console.error('Error sending message:', error)
      }
    },
    [sendMessage]
  )

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { delta } = event

      if (bubbleRef.current) {
        const rect = bubbleRef.current.getBoundingClientRect()
        const newX = bubblePosition.x - delta.x
        const newY = bubblePosition.y - delta.y
        const maxX = window.innerWidth - rect.width - extraMargins.right
        const maxY = window.innerHeight - rect.height - extraMargins.bottom

        setBubblePosition({
          x: Math.max(20, Math.min(newX, maxX)),
          y: Math.max(20, Math.min(newY, maxY)),
        })
      }
    },
    [bubbleRef, bubblePosition, setBubblePosition]
  )

  if (hideChat) return null

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={onDragEnd}
      modifiers={[withMargin]}
    >
      <DraggableChatBubble
        onClick={toggleChat}
        hasUnreadMessages={hasUnreadMessages}
        bubbleRef={bubbleRef}
        bubblePosition={bubblePosition}
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
        bubblePosition={bubblePosition}
        bubbleRef={bubbleRef}
      />
    </DndContext>
  )
}
