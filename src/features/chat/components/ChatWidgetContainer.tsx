import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/shared/constants'
import { Message as ChatMessage } from '@/features/ai/types'
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
import { Message, MessageRole } from '@/features/ai/types'
import { v4 as uuidv4 } from 'uuid'
import { debounce } from 'lodash'

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
  const lastSeenMessageIdRef = useRef<string | null>(null)

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

  const formattedMessages = useMemo(() => {
    return aiMessages
      .filter((msg: Message) => msg.role !== MessageRole.SYSTEM)
      .map((msg: Message) => {
        const id = uuidv4()
        if (
          msg.role !== MessageRole.EVENT ||
          !msg.content.includes('===DISPLAY_TEXT===')
        ) {
          return {
            id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp || Date.now()),
          }
        }
        const parts = msg.content.split('===DISPLAY_TEXT===')
        const displayText = parts.length > 1 ? parts[1].trim() : msg.content
        return {
          id,
          role: msg.role,
          content: displayText,
          timestamp: new Date(msg.timestamp || Date.now()),
        }
      })
  }, [aiMessages])

  const updateWidgetState = useCallback((updates: Partial<ChatWidgetState>) => {
    setState((prevState) => ({
      ...prevState,
      ...updates,
    }))
  }, [])

  useEffect(() => {
    const handleResize = debounce(() => {
      const dimensions = getDimensionsForMode(state.mode)
      const newPosition = constrainToWindow(state.position, dimensions)

      updateWidgetState({
        position: newPosition,
      })
    }, 100)

    // Run initially to ensure correct positioning
    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      handleResize.cancel()
    }
  }, [state.mode, updateWidgetState])

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

      if (
        newPosition.top !== state.position.top ||
        newPosition.left !== state.position.left
      ) {
        setDirection(ChatAnimationDirection.OPENING)
        updateWidgetState({
          transitionState: TransitionState.TRANSITIONING,
          position: newPosition,
        })

        setTimeout(() => {
          updateWidgetState({ transitionState: TransitionState.IDLE })
        }, 300) // Sync with $content-transition-duration
      } else {
        updateWidgetState({ transitionState: TransitionState.IDLE })
      }
    },
    [updateWidgetState, state.position]
  )

  const handleToggleMode = useCallback(() => {
    const isOpening = state.mode === ChatWidgetMode.BUBBLE
    const targetMode = isOpening ? state.previousMode : ChatWidgetMode.BUBBLE
    const dimensions = getDimensionsForMode(targetMode)
    const newPosition = constrainToWindow(state.position, dimensions)

    if (isOpening) {
      setSavedBubblePosition(state.position)
      setHasUnreadMessages(false)

      if (formattedMessages.length > 0) {
        lastSeenMessageIdRef.current =
          formattedMessages[formattedMessages.length - 1].id
      }
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
    formattedMessages,
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

  useEffect(() => {
    if (formattedMessages.length === 0) {
      return
    }

    const latestMessage = formattedMessages[formattedMessages.length - 1]
    const latestMessageId = latestMessage.id

    if (latestMessageId !== lastSeenMessageIdRef.current) {
      lastSeenMessageIdRef.current = latestMessageId

      if (
        state.mode === ChatWidgetMode.BUBBLE &&
        latestMessage.role === MessageRole.ASSISTANT
      ) {
        setHasUnreadMessages(true)
      }
    }
  }, [formattedMessages, state.mode])

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
