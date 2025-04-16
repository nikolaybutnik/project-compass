import { Box, Flex } from '@chakra-ui/react'
import React from 'react'
import { FaComment } from 'react-icons/fa'
import { ChatWidgetMode, TransitionState } from './ChatWidgetContainer'
import { chatPanelLarge, chatPanelSmall } from '../constants'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

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

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  mode,
  transitionState,
  position,
  onToggleMode,
  onToggleExpand,
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'chat-widget',
  })
  const getDimensions = () => {
    switch (mode) {
      case ChatWidgetMode.BUBBLE:
        return { width: '48px', height: '48px', borderRadius: 'full' }
      case ChatWidgetMode.PANEL:
        return {
          width: chatPanelSmall.width,
          height: chatPanelSmall.height,
          borderRadius: 'md',
        }
      case ChatWidgetMode.EXPANDED_PANEL:
        return {
          width: chatPanelLarge.width,
          height: chatPanelLarge.height,
          borderRadius: 'md',
        }
    }
  }
  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      transform={CSS.Transform.toString(transform)}
      position='fixed'
      top={`${position.top}px`}
      left={`${position.left}px`}
      bg='blue.500'
      color='white'
      boxShadow='lg'
      transition={
        transitionState === TransitionState.TRANSITIONING
          ? 'all 0.35s ease'
          : 'none'
      }
      onClick={mode === ChatWidgetMode.BUBBLE ? onToggleMode : undefined}
      cursor={mode === ChatWidgetMode.BUBBLE ? 'pointer' : 'default'}
      zIndex={1000}
      {...getDimensions()}
    >
      {mode === ChatWidgetMode.BUBBLE ? (
        <Flex align='center' justify='center' height='100%'>
          <FaComment />
        </Flex>
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
              {onToggleExpand && (
                <Box as='button' mr={2} onClick={onToggleExpand}>
                  {mode === ChatWidgetMode.PANEL ? '⬆️' : '⬇️'}
                </Box>
              )}
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
  )
}
