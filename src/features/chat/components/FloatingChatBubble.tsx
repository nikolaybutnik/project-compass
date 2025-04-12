import React from 'react'
import { IconButton, Box, Badge } from '@chakra-ui/react'
import { FaComment } from 'react-icons/fa'

interface FloatingChatBubbleProps {
  onClick: () => void
  hasUnreadMessages?: boolean
}

export const FloatingChatBubble: React.FC<FloatingChatBubbleProps> = ({
  onClick,
  hasUnreadMessages = false,
}) => {
  return (
    <Box position='fixed' right='20px' bottom='20px' zIndex={999}>
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
          colorScheme='red'
        />
      )}
    </Box>
  )
}
