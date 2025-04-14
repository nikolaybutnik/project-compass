import React, { forwardRef } from 'react'
import { Badge, Box, IconButton } from '@chakra-ui/react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { FloatingChatBubbleProps } from './FloatingChatBubble'
import { FaComment } from 'react-icons/fa'

export interface DraggableChatBubbleProps extends FloatingChatBubbleProps {
  position: { x: number; y: number }
}

export const DraggableChatBubble = forwardRef<
  HTMLDivElement,
  DraggableChatBubbleProps
>(({ onClick, hasUnreadMessages = false, position }, ref) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
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
      right={`${position.x}px`}
      bottom={`${position.y}px`}
      zIndex={999}
      style={{
        transform: transform ? CSS.Transform.toString(transform) : undefined,
      }}
    >
      <IconButton
        aria-label='Chat with Vector'
        icon={<FaComment />}
        onClick={onClick}
        borderRadius='full'
        colorScheme='blue'
        size='lg'
        boxShadow='lg'
        _hover={{ transform: 'scale(1.05)' }}
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
})
