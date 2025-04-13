import React, { useEffect, useRef, useState } from 'react'
import {
  Box,
  Flex,
  Text,
  IconButton,
  Input,
  Button,
  VStack,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react'
import { FaTimes, FaExpandAlt, FaCompress } from 'react-icons/fa'
import { MessageRole } from '@/features/ai/types'
import { ChatMessage } from '../types'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  onExpand: () => void
  isExpanded: boolean
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  onExpand,
  isExpanded,
  messages,
  onSendMessage,
}) => {
  if (!isOpen) return null

  const userBgColor = useColorModeValue('blue.100', 'blue.900')
  const aiBgColor = useColorModeValue('gray.200', 'gray.700')
  const eventBgColor = useColorModeValue('yellow.100', 'gray.800')

  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue)
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Box
      position='fixed'
      right='20px'
      bottom='80px'
      width={isExpanded ? '400px' : '320px'}
      height={isExpanded ? '500px' : '400px'}
      bg='white'
      borderRadius='md'
      boxShadow='xl'
      zIndex={998}
      display='flex'
      flexDirection='column'
      opacity={1}
      transform='translateY(0)'
      transition='all 0.3s ease'
      animation='slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
      sx={{
        '@keyframes slideUp': {
          '0%': { opacity: 0, transform: 'translateY(50px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      }}
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

      <VStack
        flex={1}
        overflowY='auto'
        p={3}
        spacing={3}
        align='stretch'
        bg='gray.50'
      >
        {messages.length === 0 ? (
          <Text color='gray.500' fontSize='sm' textAlign='center'>
            Start a conversation with Vector!
          </Text>
        ) : (
          messages.map((message) => (
            <Box
              key={message.id}
              alignSelf={
                message.role === MessageRole.USER ? 'flex-end' : 'flex-start'
              }
              bg={
                message.role === MessageRole.USER
                  ? userBgColor
                  : message.role === MessageRole.ASSISTANT
                    ? aiBgColor
                    : eventBgColor
              }
              py={2}
              px={3}
              borderRadius='lg'
              maxWidth='70%'
              boxShadow='sm'
            >
              <Text fontSize='sm'>{message.content}</Text>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </VStack>

      <Flex p={3} borderTop='1px solid' borderColor='gray.200'>
        <Input
          placeholder='Type a message...'
          mr={2}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <Button
          colorScheme='blue'
          onClick={handleSend}
          isDisabled={!inputValue.trim()}
        >
          Send
        </Button>
      </Flex>
    </Box>
  )
}
