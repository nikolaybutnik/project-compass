import React, { useState } from 'react'
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

export const FloatingChatBubble: React.FC<FloatingChatBubbleProps> = (
  props
) => {
  const [bubblePosition, setBubblePosition] = useState({
    x: 20,
    y: 20,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  )

  const withMargin: Modifier = ({
    transform,
    draggingNodeRect,
    containerNodeRect,
  }) => {
    const extraMargins = {
      top: 80,
      right: 20,
      bottom: 20,
      left: 20,
    }

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
    setBubblePosition((prev) => ({
      x: prev.x - delta.x,
      y: prev.y - delta.y,
    }))
  }

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={onDragEnd}
      modifiers={[withMargin]}
    >
      <DraggableChatBubble {...props} position={bubblePosition} />
    </DndContext>
  )
}
