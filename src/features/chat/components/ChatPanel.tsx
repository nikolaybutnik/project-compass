import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Code,
  UnorderedList,
  OrderedList,
  ListItem,
} from '@chakra-ui/react'
import { FaTimes, FaExpandAlt, FaCompress } from 'react-icons/fa'
import { ChatMessage } from '@/features/chat/types'
import { TypingIndicator } from '@/features/chat/components/TypingIndicator'
import ReactMarkdown from 'react-markdown'
import { MessageRole } from '@/features/ai/types'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  onExpand: () => void
  isExpanded: boolean
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  isTyping: boolean
  instantScroll?: boolean
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  onExpand,
  isExpanded,
  messages,
  onSendMessage,
  isTyping,
  instantScroll,
}) => {
  const userBgColor = useColorModeValue('blue.100', 'blue.900')
  const aiBgColor = useColorModeValue('gray.200', 'gray.700')
  const systemEventBgColor = useColorModeValue('gray.100', 'gray.700')
  const systemEventTextColor = useColorModeValue('gray.500', 'gray.400')

  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: instantScroll ? 'auto' : 'smooth',
        block: 'end',
      })
    }
  }, [instantScroll])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen, scrollToBottom])

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

  const memoizedMessages = useMemo(() => {
    return messages.map((message, index) => (
      <Box
        key={`${message.timestamp.toISOString()}-${index}`}
        alignSelf={
          message.role === MessageRole.EVENT
            ? 'center'
            : message.role === MessageRole.USER
              ? 'flex-end'
              : 'flex-start'
        }
        bg={
          message.role === MessageRole.EVENT
            ? systemEventBgColor
            : message.role === MessageRole.USER
              ? userBgColor
              : aiBgColor
        }
        width={message.role === MessageRole.EVENT ? '100%' : 'auto'}
        maxWidth={message.role === MessageRole.EVENT ? '100%' : '80%'}
        p={message.role === MessageRole.EVENT ? 2 : 3}
        borderRadius={message.role === MessageRole.EVENT ? 0 : '8px'}
        mb={2}
      >
        {message.role === MessageRole.EVENT ? (
          <Text fontSize='xs' color={systemEventTextColor} textAlign='center'>
            {message.content}
          </Text>
        ) : (
          <ReactMarkdown
            components={{
              p: (props) => <Text mb={2} {...props} />,
              code: (props) => <Code p={1} {...props} />,
              ul: (props) => <UnorderedList pl={4} mb={2} {...props} />,
              ol: (props) => <OrderedList pl={4} mb={2} {...props} />,
              li: (props) => <ListItem {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </Box>
    ))
  }, [messages, userBgColor, aiBgColor])

  if (!isOpen) return null

  return (
    <Box
      position='fixed'
      right='20px'
      bottom='80px'
      width={isExpanded ? '450px' : '320px'}
      height={isExpanded ? '550px' : '400px'}
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
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            width: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '24px',
          },
        }}
      >
        {messages.length === 0 ? (
          <Text color='gray.500' fontSize='sm' textAlign='center'>
            Start a conversation with Vector!
          </Text>
        ) : (
          <>
            {memoizedMessages}
            {isTyping && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </VStack>

      <Flex p={3} borderTop='1px solid' borderColor='gray.200'>
        <Input
          id='chat-message-input'
          name='message'
          autoComplete='off'
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
