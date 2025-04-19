import React, { useCallback, useMemo } from 'react'
import { FaComment, FaExpand, FaCompress, FaTimes } from 'react-icons/fa'
import { ChatWidgetMode, ChatAnimationDirection } from './ChatWidgetContainer'
import { chatPanelLarge, chatPanelSmall } from '../constants'
import { useDraggable } from '@dnd-kit/core'
import styles from '../styles/chat-widget.module.scss'
import classNames from 'classnames'

interface ChatWidgetProps {
  mode: ChatWidgetMode
  position: {
    top: number
    left: number
  }
  onToggleMode: () => void
  onToggleExpand?: () => void
  direction: ChatAnimationDirection
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  mode,
  position,
  onToggleMode,
  onToggleExpand,
  direction,
}) => {
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

  const dynamicProperties = useMemo(
    () =>
      ({
        '--top': `${position.top + stableTransform.y}px`,
        '--left': `${position.left + stableTransform.x}px`,
        '--width': `${dimensions.width}px`,
        '--height': `${dimensions.height}px`,
      }) as React.CSSProperties,
    [position, stableTransform, dimensions]
  )

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-transition={isDragging ? 'false' : 'true'}
      data-direction={direction}
      style={dynamicProperties}
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
                <button className={styles.controlButton} onClick={onToggleMode}>
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            <div className={styles.panelBody}>Test Content</div>
          </div>
        )}
      </div>
    </div>
  )
}
