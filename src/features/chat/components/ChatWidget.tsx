import React, { useCallback, useMemo } from 'react'
import { FaComment } from 'react-icons/fa'
import { ChatWidgetMode, TransitionState } from './ChatWidgetContainer'
import { chatPanelLarge, chatPanelSmall } from '../constants'
import { useDraggable } from '@dnd-kit/core'
import styles from '../styles/chat-widget.module.scss'
import classNames from 'classnames'

interface ChatWidgetProps {
  mode: ChatWidgetMode
  transitionState: TransitionState
  position: {
    top: number
    left: number
  }
  onToggleMode: () => void
  onToggleExpand?: () => void
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  mode,
  position,
  onToggleMode,
  onToggleExpand,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: 'chat-widget',
      data: {
        position,
      },
    })

  // Avoids blinking when trnsform is null during cancellations
  const stableTransform = useMemo(() => {
    return transform || { x: 0, y: 0 }
  }, [transform])

  // Gate onClick to avoid drag conflicts
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging && mode === ChatWidgetMode.BUBBLE) {
        onToggleMode()
      }
    },
    [isDragging, mode, onToggleMode]
  )

  const customProperties = useMemo(
    () =>
      ({
        '--top': `${position.top + stableTransform.y}px`,
        '--left': `${position.left + stableTransform.x}px`,
      }) as React.CSSProperties,
    [position, stableTransform]
  )

  const dimensions = useMemo(() => {
    switch (mode) {
      case ChatWidgetMode.BUBBLE:
        return {
          width: '48px',
          height: '48px',
          // clipPath: 'circle(50%)',
        }
      case ChatWidgetMode.PANEL:
        return {
          width: chatPanelSmall.width,
          height: chatPanelSmall.height,
          // clipPath: 'inset(0 0 0 0 round 4px)',
        }
      case ChatWidgetMode.EXPANDED_PANEL:
        return {
          width: chatPanelLarge.width,
          height: chatPanelLarge.height,
          // clipPath: 'inset(0 0 0 0 round 4px)',
        }
    }
  }, [mode])

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={customProperties}
      className={classNames(styles.widget, {
        [styles.bubble]: mode === ChatWidgetMode.BUBBLE,
        [styles.panel]: mode === ChatWidgetMode.PANEL,
        [styles.expandedPanel]: mode === ChatWidgetMode.EXPANDED_PANEL,
      })}
      onClick={handleClick}
    >
      <div
        className={styles.content}
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
      >
        {mode === ChatWidgetMode.BUBBLE ? (
          <div className={styles.iconWrapper}>
            <FaComment size={20} />
          </div>
        ) : (
          <div className={styles.panelContent}>
            <div className={styles.panelHeader}>
              <span>Chat</span>
              <div className={styles.panelControls}>
                <button
                  className={styles.controlButton}
                  onClick={onToggleExpand}
                >
                  {mode === ChatWidgetMode.PANEL ? '⬆️' : '⬇️'}
                </button>
                <button className={styles.controlButton} onClick={onToggleMode}>
                  ✖️
                </button>
              </div>
            </div>
            <div className={styles.panelBody}>
              {/* Panel content would go here */}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
