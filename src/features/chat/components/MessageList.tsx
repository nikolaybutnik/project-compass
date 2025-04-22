import { memo, RefObject, useEffect, useRef, useState } from 'react'
import { ChatWidgetMode } from './ChatWidgetContainer'
import { Message, MessageRole } from '@/features/ai/types'
import styles from '../styles/chat-widget.module.scss'
import ReactMarkdown from 'react-markdown'

interface MessageListProps {
  messages: Message[]
  isTyping: boolean
  mode: ChatWidgetMode
  chatMessagesRef?: RefObject<HTMLDivElement>
}

export const MessageList = memo(
  ({ messages, isTyping, mode, chatMessagesRef }: MessageListProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [allowSmoothScroll, setAllowSmoothScroll] = useState(false)

    useEffect(() => {
      let timer: ReturnType<typeof setTimeout> | undefined

      if (mode === ChatWidgetMode.BUBBLE) {
        setAllowSmoothScroll(false)
      } else {
        timer = setTimeout(() => {
          setAllowSmoothScroll(true)
        }, 300) // delay to account for open/close animation
      }

      return () => {
        if (timer) {
          clearTimeout(timer)
        }
      }
    }, [mode])

    useEffect(() => {
      if (allowSmoothScroll) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
      }
    }, [allowSmoothScroll, messages])

    const MemoizedMessage = memo(
      ({ message }: { message: Message }) => (
        <div data-role={message.role} className={styles.message}>
          <ReactMarkdown
            components={{
              p: (props) => (
                <p className={styles.markdownParagraph} {...props} />
              ),
              code: (props) => (
                <code className={styles.markdownCode} {...props} />
              ),
              ul: (props) => <ul className={styles.markdownUl} {...props} />,
              ol: (props) => <ol className={styles.markdownOl} {...props} />,
              li: (props) => <li className={styles.markdownLi} {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      ),
      (prevProps, nextProps) => {
        return (
          prevProps.message.id === nextProps.message.id &&
          prevProps.message.content === nextProps.message.content &&
          prevProps.message.role === nextProps.message.role
        )
      }
    )

    return (
      <div className={styles.chatMessages} ref={chatMessagesRef}>
        {messages.map((msg) => (
          <MemoizedMessage key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div data-role={MessageRole.ASSISTANT} className={styles.message}>
            <div className={styles.typingIndicator}>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.messages === nextProps.messages &&
      prevProps.isTyping === nextProps.isTyping &&
      prevProps.mode === nextProps.mode
    )
  }
)
