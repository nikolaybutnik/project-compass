import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from 'react'
import {
  Box,
  Flex,
  Text,
  Input,
  Button,
  VStack,
  useColorModeValue,
  Code,
  UnorderedList,
  OrderedList,
  ListItem,
} from '@chakra-ui/react'
import { ChatMessage } from '@/features/chat/types'
import { TypingIndicator } from '@/features/chat/components/TypingIndicator'
import ReactMarkdown from 'react-markdown'
import { MessageRole } from '@/features/ai/types'
import { DraggableChatHeader } from './DraggableChatHeader'
import { chatPanelLarge, chatPanelSmall } from '../constants'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  onExpand: () => void
  isExpanded: boolean
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  isTyping: boolean
  instantScroll?: boolean
  panelPosition: { x: number; y: number }
}

export const ChatPanel = memo(
  ({
    isOpen,
    onClose,
    onExpand,
    isExpanded,
    messages,
    onSendMessage,
    isTyping,
    instantScroll,
    panelPosition,
  }: ChatPanelProps) => {
    const userBgColor = useColorModeValue('blue.100', 'blue.900')
    const aiBgColor = useColorModeValue('gray.200', 'gray.700')
    const systemEventBgColor = useColorModeValue('gray.100', 'gray.700')
    const systemEventTextColor = useColorModeValue('gray.500', 'gray.400')

    const [inputValue, setInputValue] = useState('')
    const [isVisible, setIsVisible] = useState(false)
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

    useEffect(() => {
      if (isOpen) {
        // Delay the appearance
        const timer = setTimeout(() => {
          setIsVisible(true)
        }, 100) //

        return () => clearTimeout(timer)
      } else {
        setIsVisible(false)
      }
      return
    }, [isOpen])

    const handleSend = useCallback(() => {
      if (inputValue.trim()) {
        onSendMessage(inputValue)
        setInputValue('')
      }
    }, [inputValue, onSendMessage])

    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          handleSend()
        }
      },
      [handleSend]
    )

    const panelWidth = isExpanded ? chatPanelLarge.width : chatPanelSmall.width
    const panelHeight = isExpanded
      ? chatPanelLarge.height
      : chatPanelSmall.height

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
            <Text
              fontSize={message.role === MessageRole.EVENT ? 'xs' : 'sm'}
              color={systemEventTextColor}
              textAlign='center'
            >
              {message.content}
            </Text>
          ) : (
            <ReactMarkdown
              components={{
                p: (props) => <Text fontSize='sm' mb={2} {...props} />,
                code: (props) => <Code fontSize='sm' p={1} {...props} />,
                ul: (props) => (
                  <UnorderedList fontSize='sm' pl={4} mb={2} {...props} />
                ),
                ol: (props) => (
                  <OrderedList fontSize='sm' pl={4} mb={2} {...props} />
                ),
                li: (props) => <ListItem fontSize='sm' {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </Box>
      ))
    }, [
      messages,
      userBgColor,
      aiBgColor,
      systemEventBgColor,
      systemEventTextColor,
    ])

    if (!isOpen) return null

    return (
      <Box
        className='chat-panel'
        style={{
          position: 'fixed',
          left: `${panelPosition.x - panelWidth}px`,
          top: `${panelPosition.y - panelHeight}px`,
          width: `${panelWidth}px`,
          height: `${panelHeight}px`,
          backgroundColor: 'white',
          borderRadius: '0.375rem',
          boxShadow:
            '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          zIndex: 998,
          display: 'flex',
          flexDirection: 'column',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <DraggableChatHeader
          onClose={onClose}
          onExpand={onExpand}
          isExpanded={isExpanded}
        />

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
)
