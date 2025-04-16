import React, { memo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Box, IconButton } from '@chakra-ui/react'
import { FaComment } from 'react-icons/fa'
import { CSS } from '@dnd-kit/utilities'

interface DraggableChatBubbleProps {
  onClick: () => void
  hasUnreadMessages?: boolean
  bubbleRef: React.RefObject<HTMLDivElement>
  bubblePosition: { x: number; y: number }
}

export const DraggableChatBubble = memo(
  ({
    onClick,
    hasUnreadMessages,
    bubbleRef,
    bubblePosition,
  }: DraggableChatBubbleProps) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: 'draggable-bubble',
      })

    return (
      <Box
        ref={(node) => {
          setNodeRef(node)
          ;(bubbleRef as React.MutableRefObject<Element | null>).current = node
        }}
        {...attributes}
        {...listeners}
        position='fixed'
        left={`${bubblePosition.x}px`}
        top={`${bubblePosition.y}px`}
        zIndex={999}
        style={{
          transform: transform ? CSS.Transform.toString(transform) : undefined,
        }}
      >
        <IconButton
          aria-label='Chat with Vector'
          icon={
            <>
              <FaComment />
              {hasUnreadMessages && (
                <Box
                  position='absolute'
                  top='-2px'
                  right='-2px'
                  borderRadius='full'
                  bg='red.500'
                  boxSize='14px'
                  borderWidth='2px'
                  borderColor='white'
                  p={0}
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                  zIndex={1000}
                />
              )}
            </>
          }
          onClick={onClick}
          borderRadius='full'
          colorScheme='blue'
          size='lg'
          boxShadow={
            isDragging
              ? '0 0 15px -2px rgba(0, 0, 0, 0.25), 6px 6px 10px -5px rgba(0, 0, 0, 0.2)'
              : 'lg'
          }
          transform={isDragging ? 'translateY(-3px)' : 'none'}
          _hover={{ transform: 'scale(1.1)' }}
          _active={{ bg: 'blue.500', opacity: 0.9 }}
          transition='transform 0.2s'
        />
      </Box>
    )
  }
)
