import React, { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { DraggableChatBubble } from './DraggableChatBubble'

export interface FloatingChatBubbleProps {
  onClick: () => void
  hasUnreadMessages?: boolean
}

const extraMargins = {
  top: 80,
  right: 20,
  bottom: 20,
  left: 20,
}

export const FloatingChatBubble: React.FC<FloatingChatBubbleProps> = (
  props
) => {
  const [bubblePosition, setBubblePosition] = useState({
    x: 20, // 20px from right
    y: 20, // 20px from bottom
  })

  const bubbleRef = useRef<HTMLDivElement | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  )

  useEffect(() => {
    const updatePositionOnResize = () => {
      if (bubbleRef.current) {
        const rect = bubbleRef.current.getBoundingClientRect()
        const maxX = window.innerWidth - rect.width - extraMargins.right
        const maxY = window.innerHeight - rect.height - extraMargins.bottom

        setBubblePosition((prev) => ({
          x: Math.min(prev.x, maxX),
          y: Math.min(prev.y, maxY),
        }))
      }
    }

    updatePositionOnResize()
    window.addEventListener('resize', updatePositionOnResize)
    return () => window.removeEventListener('resize', updatePositionOnResize)
  }, [])

  const withMargin: Modifier = ({
    transform,
    draggingNodeRect,
    containerNodeRect,
  }) => {
    // If no rect is available, return the original transform to avoid breaking
    if (!draggingNodeRect || !containerNodeRect) {
      return transform
    }

    // Calculate the draggable's current position (top-left corner)
    const currentX = draggingNodeRect.left + transform.x
    const currentY = draggingNodeRect.top + transform.y

    // Define viewport bounds with 20px margin
    const minX = extraMargins.left
    const minY = extraMargins.top
    const maxX = window.innerWidth - draggingNodeRect.width - extraMargins.right
    const maxY =
      window.innerHeight - draggingNodeRect.height - extraMargins.bottom

    // Clamp the position to stay within bounds
    const clampedX = Math.max(minX, Math.min(currentX, maxX))
    const clampedY = Math.max(minY, Math.min(currentY, maxY))

    return {
      ...transform,
      x: clampedX - draggingNodeRect.left,
      y: clampedY - draggingNodeRect.top,
    }
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { delta } = event

    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect()
      const newX = bubblePosition.x - delta.x
      const newY = bubblePosition.y - delta.y
      const maxX = window.innerWidth - rect.width - extraMargins.right
      const maxY = window.innerHeight - rect.height - extraMargins.bottom

      setBubblePosition({
        x: Math.max(20, Math.min(newX, maxX)),
        y: Math.max(20, Math.min(newY, maxY)),
      })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={onDragEnd}
      modifiers={[withMargin]}
    >
      <DraggableChatBubble
        {...props}
        position={bubblePosition}
        ref={bubbleRef}
      />
    </DndContext>
  )
}
