import { Box, Flex } from '@chakra-ui/react'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { FaComment } from 'react-icons/fa'
import { ChatWidgetMode, TransitionState } from './ChatWidgetContainer'
import { chatPanelLarge, chatPanelSmall } from '../constants'
import { useDraggable } from '@dnd-kit/core'

interface ChatWidgetProps {
  mode: ChatWidgetMode
  transitionState: TransitionState
  position: {
    top: number
    left: number
  }
  onToggleMode: () => void
  onToggleExpand?: () => void
}

const ANIMATION_DURATION = 200

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  mode,
  transitionState,
  position,
  onToggleMode,
  onToggleExpand,
}) => {
  const initialPressCoordinatesRef = useRef<{ x: number; y: number } | null>(
    null
  )

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'chat-widget',
    data: {
      position,
      initialCoordinates: initialPressCoordinatesRef.current,
    },
  })

  const combinedRef = useCallback(
    (node: HTMLElement | null) => {
      setNodeRef(node)

      if (node) {
        const pointerDownHandler = (e: PointerEvent) => {
          initialPressCoordinatesRef.current = { x: e.clientX, y: e.clientY }
        }

        const pointerUpHandler = () => {
          initialPressCoordinatesRef.current = null
        }

        node.addEventListener('pointerdown', pointerDownHandler, {
          passive: true,
        })
        node.addEventListener('pointerup', pointerUpHandler, { passive: true })
        node.addEventListener('pointercancel', pointerUpHandler, {
          passive: true,
        })

        return () => {
          node.removeEventListener('pointerdown', pointerDownHandler)
          node.removeEventListener('pointerup', pointerUpHandler)
          node.removeEventListener('pointercancel', pointerUpHandler)
        }
      }
      return
    },

    [setNodeRef]
  )

  const dimensions = useMemo(() => {
    switch (mode) {
      case ChatWidgetMode.BUBBLE:
        return {
          width: '48px',
          height: '48px',
          clipPath: 'circle(50%)',
          transform: 'scale(1) translateY(0)',
          contentOpacity: 1,
        }
      case ChatWidgetMode.PANEL:
        return {
          width: chatPanelSmall.width,
          height: chatPanelSmall.height,
          clipPath: 'inset(0 0 0 0 round 4px)',
          transform: 'scale(1.25) translateY(-10px)',
          contentOpacity: 1,
        }
      case ChatWidgetMode.EXPANDED_PANEL:
        return {
          width: chatPanelLarge.width,
          height: chatPanelLarge.height,
          clipPath: 'inset(0 0 0 0 round 4px)',
          transform: 'scale(1.25) translateY(-20px)',
          contentOpacity: 1,
        }
    }
  }, [mode])

  const widgetStyle: React.CSSProperties = {
    position: 'fixed',
    top: transform ? position.top + transform.y : position.top,
    left: transform ? position.left + transform.x : position.left,
    willChange: 'transform, clip-path',
    ...dimensions,
    transition:
      transitionState === TransitionState.TRANSITIONING
        ? `transform ${ANIMATION_DURATION}ms ease, clip-path ${ANIMATION_DURATION}ms ease`
        : 'none',
  }

  return (
    <Box
      ref={combinedRef}
      {...attributes}
      {...listeners}
      style={widgetStyle}
      bg='blue.500'
      color='white'
      boxShadow='lg'
      onClick={mode === ChatWidgetMode.BUBBLE ? onToggleMode : undefined}
      cursor={mode === ChatWidgetMode.BUBBLE ? 'pointer' : 'default'}
      zIndex={1000}
    >
      <Box
        opacity={dimensions.contentOpacity}
        transition={
          transitionState === TransitionState.TRANSITIONING
            ? `opacity ${ANIMATION_DURATION}ms ease`
            : 'none'
        }
      >
        {mode === ChatWidgetMode.BUBBLE ? (
          <Box position='relative' width='100%' height='100%'>
            <Box
              position='absolute'
              width='48px'
              height='48px'
              top='0'
              left='0'
              display='flex'
              alignItems='center'
              justifyContent='center'
            >
              <FaComment size={20} />
            </Box>
          </Box>
        ) : (
          <Flex direction='column' height='100%'>
            <Flex
              p={2}
              borderBottom='1px solid'
              borderColor='blue.400'
              justify='space-between'
            >
              <Box>Chat</Box>
              <Flex>
                <Box as='button' mr={2} onClick={onToggleExpand}>
                  {mode === ChatWidgetMode.PANEL ? '⬆️' : '⬇️'}
                </Box>
                <Box as='button' onClick={onToggleMode}>
                  ✖️
                </Box>
              </Flex>
            </Flex>
            <Flex flex={1} direction='column'>
              {/* Panel content would go here */}
            </Flex>
          </Flex>
        )}
      </Box>
    </Box>
  )
}
