import { Modifier } from '@dnd-kit/core'
import {
  chatPanelLarge,
  chatPanelSmall,
  extraMargins,
} from '@/features/chat/constants'
import { ChatWidgetMode } from '../components/ChatWidgetContainer'

export const restrictToWindowOnly: Modifier = (event) => {
  if (!event.draggingNodeRect) {
    return event.transform
  }

  const { active, transform, draggingNodeRect } = event

  // Get element dimensions and position
  const width = draggingNodeRect.width
  const height = draggingNodeRect.height
  const position = active?.data?.current?.position || {
    left: draggingNodeRect.left,
    top: draggingNodeRect.top,
  }

  // Calculate current position (with transform)
  const currentX = position.left + transform.x
  const currentY = position.top + transform.y

  // Calculate boundaries
  const minX = 0
  const minY = 0
  const maxX = window.innerWidth - width
  const maxY = window.innerHeight - height

  // Apply constraints
  const clampedX = Math.max(minX, Math.min(currentX, maxX))
  const clampedY = Math.max(minY, Math.min(currentY, maxY))

  return {
    ...transform,
    x: clampedX - position.left,
    y: clampedY - position.top,
  }
}
