import { Modifier } from '@dnd-kit/core'
import { constrainToWindow } from './positioning'

export const restrictToWindowOnly: Modifier = (event) => {
  if (!event.draggingNodeRect) {
    return event.transform
  }

  const { active, transform, draggingNodeRect } = event

  const dimensions = {
    width: draggingNodeRect.width,
    height: draggingNodeRect.height,
  }

  const position = active?.data?.current?.position || {
    left: draggingNodeRect.left,
    top: draggingNodeRect.top,
  }

  const currentPosition = {
    left: position.left + transform.x,
    top: position.top + transform.y,
  }

  // Calculate position relative to the boundaries
  const constrainedPosition = constrainToWindow(currentPosition, dimensions)

  return {
    ...transform,
    x: constrainedPosition.left - position.left,
    y: constrainedPosition.top - position.top,
  }
}
