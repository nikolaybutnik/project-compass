import { Modifier } from '@dnd-kit/core'
import { extraMargins } from '@/features/chat/constants'

export const withMargin: Modifier = ({
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
