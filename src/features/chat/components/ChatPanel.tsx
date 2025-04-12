import React from 'react'
import {
  Box,
  Flex,
  Text,
  IconButton,
  Input,
  Button,
  VStack,
  HStack,
} from '@chakra-ui/react'
import { FaTimes, FaExpandAlt, FaCompress } from 'react-icons/fa'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  onExpand: () => void
  isExpanded: boolean
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  onExpand,
  isExpanded,
}) => {
  if (!isOpen) return null

  return (
    <Box
      position='fixed'
      right='20px'
      bottom='80px'
      width='320px'
      height='400px'
      bg='white'
      borderRadius='md'
      boxShadow='xl'
      zIndex={998}
      display='flex'
      flexDirection='column'
      transition='all 0.3s ease'
    >
      <Flex
        p={3}
        borderBottom='1px solid'
        borderColor='gray.200'
        alignItems='center'
        justifyContent='space-between'
        bg='blue.500'
        color='white'
        borderTopRadius='md'
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

      <VStack flex={1} overflowY='auto' p={3} spacing={3} align='stretch'>
        <Text color='gray.500' fontSize='sm' textAlign='center'>
          Chat messages will appear here
        </Text>
      </VStack>

      <Flex p={3} borderTop='1px solid' borderColor='gray.200'>
        <Input placeholder='Type a message...' mr={2} />
        <Button colorScheme='blue'>Send</Button>
      </Flex>
    </Box>
  )
}
