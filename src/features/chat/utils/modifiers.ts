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

  const { active, activatorEvent, transform, draggingNodeRect } = event

  // First drag detection - store first drag data
  if (
    active?.data?.current?.initialCoordinates &&
    !active.data.current.dragStarted &&
    activatorEvent
  ) {
    active.data.current.dragStarted = true

    // Store initial offset between where user clicked and where drag activated
    const initialClick = active.data.current.initialCoordinates
    active.data.current.activationOffset = {
      x: (activatorEvent as PointerEvent).clientX - initialClick.x,
      y: (activatorEvent as PointerEvent).clientY - initialClick.y,
    }
  }

  // Get element dimensions and position
  const width = draggingNodeRect.width
  const height = draggingNodeRect.height
  const position = active?.data?.current?.position || {
    left: draggingNodeRect.left,
    top: draggingNodeRect.top,
  }

  // Get activation offset (if available)
  const offset = active?.data?.current?.activationOffset || { x: 0, y: 0 }

  // Calculate current position (with transform)
  const currentX = position.left + transform.x
  const currentY = position.top + transform.y

  // Calculate boundaries - no extra margins
  const minX = 0
  const minY = 0
  const maxX = window.innerWidth - width
  const maxY = window.innerHeight - height

  // Apply constraints to true position (removing activation offset)
  const trueX = currentX - offset.x
  const trueY = currentY - offset.y

  const clampedX = Math.max(minX, Math.min(trueX, maxX))
  const clampedY = Math.max(minY, Math.min(trueY, maxY))

  return {
    ...transform,
    x: clampedX - position.left + offset.x,
    y: clampedY - position.top + offset.y,
  }
}
