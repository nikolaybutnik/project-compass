import React, { forwardRef, memo } from 'react'
import { Badge, Box, IconButton } from '@chakra-ui/react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { FaComment } from 'react-icons/fa'

interface DraggableChatBubbleProps {
  onClick: () => void
  hasUnreadMessages?: boolean
  ref: React.RefObject<HTMLDivElement>
  bubblePosition: { x: number; y: number }
  isDropped: boolean
}

const bubbleStyles = {
  animation: {
    base: 'none',
    dropped: 'bubbleDrop 0.3s ease-out',
  },
  '@keyframes bubbleDrop': {
    '0%': { transform: 'scale(1.1)' },
    '50%': { transform: 'scale(0.9)' },
    '100%': { transform: 'scale(1)' },
  },
}

export const DraggableChatBubble = memo(
  forwardRef<HTMLDivElement, DraggableChatBubbleProps>(
    (
      { onClick, hasUnreadMessages = false, bubblePosition, isDropped },
      ref
    ) => {
      const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
          id: 'draggable-bubble',
        })

      return (
        <Box
          ref={(node) => {
            setNodeRef(node) // Pass node to dnd-kit for drag tracking
            if (typeof ref === 'function') {
              // Call parent’s callback ref, if provided (currently not used)
              ref(node)
            } else if (ref) {
              // Assign node to parent’s RefObject for size calculations (drag/resize)
              ref.current = node
            }
          }}
          {...attributes}
          {...listeners}
          className='chat-bubble'
          position='fixed'
          right={`${bubblePosition.x}px`}
          bottom={`${bubblePosition.y}px`}
          zIndex={999}
          style={{
            transform: transform
              ? CSS.Transform.toString(transform)
              : undefined,
          }}
          sx={{
            animation: isDropped
              ? bubbleStyles.animation.dropped
              : bubbleStyles.animation.base,
            '@keyframes bubbleDrop': bubbleStyles['@keyframes bubbleDrop'],
          }}
        >
          <IconButton
            aria-label='Chat with Vector'
            icon={<FaComment />}
            onClick={onClick}
            borderRadius='full'
            colorScheme='blue'
            size='lg'
            boxShadow={
              isDragging
                ? '0 0 15px -2px rgba(0, 0, 0, 0.25), 6px 6px 10px -5px rgba(0, 0, 0, 0.2), -6px 6px 10px -5px rgba(0, 0, 0, 0.2), 0 -6px 10px -5px rgba(0, 0, 0, 0.2), 6px -6px 10px -5px rgba(0, 0, 0, 0.2), -6px -6px 10px -5px rgba(0, 0, 0, 0.2)'
                : 'lg'
            }
            transform={isDragging ? 'translateY(-3px)' : 'none'}
            _hover={{ transform: 'scale(1.1)' }}
            _active={{
              bg: 'blue.500',
              opacity: 0.9,
            }}
            transition='all 0.2s'
          />

          {hasUnreadMessages && (
            <Badge
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
            />
          )}
        </Box>
      )
    }
  )
)
