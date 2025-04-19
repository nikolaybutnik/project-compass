import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/shared/constants'
import { ChatMessage } from '@/features/chat/types'
import { useAI } from '@/features/ai/context/aiContext'
import {
  DndContext,
  useSensors,
  useSensor,
  PointerSensor,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import { restrictToWindowOnly } from '../utils/modifiers'
import { ChatWidget } from './ChatWidget'
import { getDimensionsForMode } from '../utils/positioning'
import { constrainToWindow } from '../utils/positioning'
import { extraMargins } from '../constants'
import { MessageRole } from '@/features/ai/types'

export enum ChatWidgetMode {
  BUBBLE = 'bubble',
  PANEL = 'panel',
  EXPANDED_PANEL = 'expanded_panel',
}

export enum TransitionState {
  IDLE = 'idle',
  DRAGGING = 'dragging',
  TRANSITIONING = 'transitioning',
}

export enum ChatAnimationDirection {
  OPENING = 'opening',
  CLOSING = 'closing',
}

interface ChatWidgetState {
  mode: ChatWidgetMode
  previousMode: ChatWidgetMode
  transitionState: TransitionState
  position: {
    // Corresonds to top left corner (anchor point) of the widget
    // Calulated from left to right, top to bottom
    top: number
    left: number
  }
  isTyping: boolean
  hasUnreadMessages: boolean
  messages: ChatMessage[]
}

const ANIMATION_DURATION = 200

export const ChatWidgetContainer: React.FC = () => {
  const newMessageRef = useRef(false)
  const lastSeenMessageCount = useRef(0)
  const justOpenedRef = useRef(false)
  const bubbleRef = useRef<HTMLDivElement | null>(null)

  const location = useLocation()
  const { sendMessage, messages: aiMessages, isLoading: aiLoading } = useAI()

  const hiddenRoutes = [ROUTES.HOME, ROUTES.LOGIN]
  const hideChat = useMemo(
    () =>
      hiddenRoutes.some(
        (path) =>
          location.pathname === path || location.pathname.startsWith(path + '/')
      ),
    [location.pathname]
  )
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  )

  const [direction, setDirection] = useState<ChatAnimationDirection>(
    ChatAnimationDirection.OPENING
  )
  const [state, setState] = useState<ChatWidgetState>(() => {
    const savedPosition = null // placeholder for local storage
    return {
      mode: ChatWidgetMode.BUBBLE,
      previousMode: ChatWidgetMode.PANEL,
      transitionState: TransitionState.IDLE,
      position: savedPosition || {
        top: window.innerHeight - 48 - extraMargins.bottom,
        left: window.innerWidth - 48 - extraMargins.right,
      },
      isTyping: false,
      hasUnreadMessages: false,
      messages: [],
    }
  })
  const [savedBubblePosition, setSavedBubblePosition] = useState<{
    top: number
    left: number
  }>({
    top: window.innerHeight - 48 - extraMargins.bottom,
    left: window.innerWidth - 48 - extraMargins.right,
  })
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)

  const updateWidgetState = useCallback((updates: Partial<ChatWidgetState>) => {
    setState((prevState) => ({
      ...prevState,
      ...updates,
    }))
  }, [])

  const handleDragStart = useCallback(
    (_event: DragStartEvent) => {
      updateWidgetState({ transitionState: TransitionState.DRAGGING })
    },
    [updateWidgetState]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { delta } = event
      const newPosition = {
        top: Math.max(0, state.position.top + delta.y),
        left: Math.max(0, state.position.left + delta.x),
      }

      setDirection(ChatAnimationDirection.OPENING)
      updateWidgetState({
        transitionState: TransitionState.TRANSITIONING,
        position: newPosition,
      })

      setTimeout(() => {
        updateWidgetState({ transitionState: TransitionState.IDLE })
      }, 300) // Sync with $content-transition-duration
    },
    [updateWidgetState, state.position, direction]
  )

  const handleToggleMode = useCallback(() => {
    const isOpening = state.mode === ChatWidgetMode.BUBBLE
    const targetMode = isOpening ? state.previousMode : ChatWidgetMode.BUBBLE
    const dimensions = getDimensionsForMode(targetMode)
    const newPosition = constrainToWindow(state.position, dimensions)

    if (isOpening) {
      setSavedBubblePosition(state.position)
      setHasUnreadMessages(false)
    }

    setDirection(
      isOpening
        ? ChatAnimationDirection.OPENING
        : ChatAnimationDirection.CLOSING
    )

    updateWidgetState({
      mode: targetMode,
      previousMode: isOpening ? ChatWidgetMode.PANEL : state.mode,
      transitionState: TransitionState.TRANSITIONING,
      position: isOpening ? newPosition : savedBubblePosition,
    })
    setTimeout(() => {
      updateWidgetState({ transitionState: TransitionState.IDLE })
    }, ANIMATION_DURATION)
  }, [
    updateWidgetState,
    savedBubblePosition,
    state.mode,
    state.previousMode,
    state.position,
  ])

  const handleToggleExpand = useCallback(() => {
    const targetMode =
      state.mode === ChatWidgetMode.EXPANDED_PANEL
        ? ChatWidgetMode.PANEL
        : ChatWidgetMode.EXPANDED_PANEL
    const dimensions = getDimensionsForMode(targetMode)
    const newPosition = constrainToWindow(state.position, dimensions)

    updateWidgetState({
      mode: targetMode,
      transitionState: TransitionState.TRANSITIONING,
      position: newPosition,
    })
    setTimeout(() => {
      updateWidgetState({ transitionState: TransitionState.IDLE })
    }, ANIMATION_DURATION)
  }, [updateWidgetState, state.mode, state.position])

  // // Handle bubble and panel positions if window is resized
  // // useEffect(() => {
  // //   const updatePositionsOnResize = debounce(() => {
  // //     // Handle bubble position constraints
  // //     if (bubbleRef.current) {
  // //       const bubbleRect = bubbleRef.current.getBoundingClientRect()
  // //       const maxBubbleX =
  // //         window.innerWidth - bubbleRect.width - extraMargins.right
  // //       const maxBubbleY =
  // //         window.innerHeight - bubbleRect.height - extraMargins.bottom

  // //       setBubblePosition((prev) => ({
  // //         x: Math.min(prev.x, maxBubbleX),
  // //         y: Math.min(prev.y, maxBubbleY),
  // //       }))
  // //     }

  // //     // Handle panel position constraints
  // //     const panelWidth = isExpanded
  // //       ? chatPanelLarge.width
  // //       : chatPanelSmall.width
  // //     const panelHeight = isExpanded
  // //       ? chatPanelLarge.height
  // //       : chatPanelSmall.height
  // //     const maxPanelX = window.innerWidth - panelWidth - extraMargins.right
  // //     const maxPanelY = window.innerHeight - panelHeight - extraMargins.bottom

  // //     setPanelPosition((prev) => ({
  // //       x: Math.min(prev.x, maxPanelX),
  // //       y: Math.min(prev.y, maxPanelY),
  // //     }))
  // //   }, 100)

  // //   updatePositionsOnResize()
  // //   window.addEventListener('resize', updatePositionsOnResize)
  // //   return () => {
  // //     window.removeEventListener('resize', updatePositionsOnResize)
  // //     updatePositionsOnResize.cancel()
  // //   }
  // // }, [bubbleRef, setBubblePosition, setPanelPosition])

  const formattedMessages = useMemo(() => {
    const lastMessage = aiMessages[aiMessages.length - 1]

    if (
      state.mode === ChatWidgetMode.BUBBLE &&
      lastMessage?.role === MessageRole.ASSISTANT
    ) {
      setHasUnreadMessages(true)
    }

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
            timestamp: new Date(), // For potential later use
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

  // // Set chat unread indicator
  // useEffect(() => {
  //   if (formattedMessages?.length) {
  //     setMessages(formattedMessages)

  //     const lastMessage = aiMessages[aiMessages.length - 1]
  //     if (
  //       !isOpen &&
  //       lastMessage?.role === MessageRole.ASSISTANT &&
  //       formattedMessages.length > lastSeenMessageCount.current
  //     ) {
  //       setHasUnreadMessages(true)
  //     }
  //   }
  // }, [formattedMessages, aiMessages, isOpen])

  // const toggleChat = useCallback(() => {
  //   const opening = !isOpen
  //   setIsOpen(opening)

  //   if (opening) {
  //     justOpenedRef.current = true
  //     setHasUnreadMessages(false)
  //     lastSeenMessageCount.current = messages.length
  //   }
  // }, [isOpen, messages.length])

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

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToWindowOnly]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {hideChat ? null : (
        <ChatWidget
          mode={state.mode}
          position={state.position}
          onToggleMode={handleToggleMode}
          onToggleExpand={handleToggleExpand}
          direction={direction}
          messages={formattedMessages}
          onSendMessage={handleSendMessage}
          isTyping={aiLoading}
          hasUnreadMessages={hasUnreadMessages}
        />
      )}
    </DndContext>
  )
}
