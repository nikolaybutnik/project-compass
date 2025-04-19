import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FaComment, FaExpand, FaCompress, FaTimes } from 'react-icons/fa'
import { ChatWidgetMode, ChatAnimationDirection } from './ChatWidgetContainer'
import { chatPanelLarge, chatPanelSmall } from '../constants'
import { useDraggable } from '@dnd-kit/core'
import styles from '../styles/chat-widget.module.scss'
import classNames from 'classnames'
import { ChatMessage } from '../types'
import { MessageRole } from '@/features/ai/types'
interface ChatWidgetProps {
  mode: ChatWidgetMode
  position: {
    top: number
    left: number
  }
  onToggleMode: () => void
  onToggleExpand?: () => void
  direction: ChatAnimationDirection
  messages: ChatMessage[]
  onSendMessage: (content: string) => void
  isTyping: boolean
  hasUnreadMessages: boolean
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  mode,
  position,
  onToggleMode,
  onToggleExpand,
  direction,
  messages,
  onSendMessage,
  isTyping,
  hasUnreadMessages,
}) => {
  const [inputText, setInputText] = useState('')

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: 'chat-widget',
      data: {
        position,
      },
    })

  const stableTransform = useMemo(() => {
    return transform || { x: 0, y: 0 }
  }, [transform])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging && mode === ChatWidgetMode.BUBBLE) {
        onToggleMode()
      }
    },
    [isDragging, mode, onToggleMode]
  )

  const dimensions = useMemo(() => {
    switch (mode) {
      case ChatWidgetMode.BUBBLE:
        return {
          width: 48,
          height: 48,
        }
      case ChatWidgetMode.PANEL:
        return {
          width: chatPanelSmall.width,
          height: chatPanelSmall.height,
        }
      case ChatWidgetMode.EXPANDED_PANEL:
        return {
          width: chatPanelLarge.width,
          height: chatPanelLarge.height,
        }
    }
  }, [mode])

  const dynamicWidgetProperties = useMemo(
    () =>
      ({
        '--top': `${position.top + stableTransform.y}px`,
        '--left': `${position.left + stableTransform.x}px`,
        '--width': `${dimensions.width}px`,
        '--height': `${dimensions.height}px`,
      }) as React.CSSProperties,
    [position, stableTransform, dimensions]
  )

  // Minor bug: position of unread indicator resets to last known position if
  // AI message is received while the widget is being dragged
  const dynamicUnreadIndicatorProperties = useMemo(
    () =>
      ({
        '--top': `${position.top + stableTransform.y}px`,
        '--left': `${position.left + stableTransform.x + 36}px`,
      }) as React.CSSProperties,
    [position, stableTransform]
  )

  return (
    <>
      {hasUnreadMessages && (
        <div
          className={styles.unreadIndicator}
          data-transition={isDragging ? 'false' : 'true'}
          onClick={handleClick}
          style={dynamicUnreadIndicatorProperties}
        />
      )}
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        data-transition={isDragging ? 'false' : 'true'}
        data-direction={direction}
        style={dynamicWidgetProperties}
        className={classNames(styles.widget, {
          [styles.bubble]: mode === ChatWidgetMode.BUBBLE,
          [styles.panel]: mode === ChatWidgetMode.PANEL,
          [styles.expandedPanel]: mode === ChatWidgetMode.EXPANDED_PANEL,
        })}
        onClick={handleClick}
      >
        <div className={styles.content}>
          {mode === ChatWidgetMode.BUBBLE ? (
            <div className={styles.iconWrapper}>
              <FaComment size={20} />
            </div>
          ) : (
            <div className={styles.panelContent}>
              <div className={styles.panelHeader}>
                <span>Vector</span>
                <div className={styles.panelControls}>
                  <button
                    className={styles.controlButton}
                    onClick={onToggleExpand}
                  >
                    {mode === ChatWidgetMode.PANEL ? (
                      <FaExpand size={20} />
                    ) : (
                      <FaCompress size={20} />
                    )}
                  </button>
                  <button
                    className={styles.controlButton}
                    onClick={onToggleMode}
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
              </div>
              <div className={styles.panelBody}>
                <div className={styles.chatMessages}>
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      data-role={msg.role}
                      className={styles.message}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {isTyping && (
                    <div
                      data-role={MessageRole.ASSISTANT}
                      className={styles.message}
                    >
                      ...
                    </div>
                  )}
                </div>
                <div className={styles.chatInput}>
                  <input
                    type='text'
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyUp={(e) => {
                      if (
                        e.key === 'Enter' &&
                        !e.shiftKey &&
                        inputText.trim()
                      ) {
                        onSendMessage(inputText)
                        setInputText('')
                      }
                    }}
                    placeholder="What's on your mind?"
                  />
                  <button
                    onClick={() => {
                      if (inputText.trim()) {
                        onSendMessage(inputText)
                        setInputText('')
                      }
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
