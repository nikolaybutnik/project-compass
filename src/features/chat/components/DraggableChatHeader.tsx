import React from 'react'
import { Flex, Text, HStack, IconButton } from '@chakra-ui/react'
import { FaTimes, FaExpandAlt, FaCompress } from 'react-icons/fa'
import { useDraggable } from '@dnd-kit/core'

interface DraggableChatHeaderProps {
  onClose: () => void
  onExpand: () => void
  isExpanded: boolean
}

export const DraggableChatHeader: React.FC<DraggableChatHeaderProps> = ({
  onClose,
  onExpand,
  isExpanded,
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: 'draggable-header',
  })

  return (
    <Flex
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      p={3}
      borderBottom='1px solid'
      borderColor='gray.200'
      alignItems='center'
      justifyContent='space-between'
      bg='blue.500'
      color='white'
      borderTopRadius='md'
      cursor='grab'
      _active={{ cursor: 'grabbing' }}
    >
      <Text fontWeight='bold'>Vector</Text>
      <HStack>
        <IconButton
          aria-label={isExpanded ? 'Minimize' : 'Expand'}
          icon={isExpanded ? <FaCompress /> : <FaExpandAlt />}
          onClick={onExpand}
          size='sm'
          variant='ghost'
          color='white'
          _hover={{ bg: 'blue.600' }}
        />
        <IconButton
          aria-label='Close chat'
          icon={<FaTimes />}
          onClick={onClose}
          size='sm'
          variant='ghost'
          color='white'
          _hover={{ bg: 'blue.600' }}
        />
      </HStack>
    </Flex>
  )
}
