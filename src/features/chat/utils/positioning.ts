import { ChatWidgetMode } from '../components/ChatWidgetContainer'
import { chatPanelSmall, chatPanelLarge } from '../constants'
import { extraMargins } from '../constants'

interface Position {
  left: number
  top: number
}

interface Dimensions {
  width: number
  height: number
}

export const getDimensionsForMode = (mode: ChatWidgetMode): Dimensions => {
  switch (mode) {
    case ChatWidgetMode.BUBBLE:
      return { width: 48, height: 48 }
    case ChatWidgetMode.PANEL:
      return { width: chatPanelSmall.width, height: chatPanelSmall.height }
    case ChatWidgetMode.EXPANDED_PANEL:
      return { width: chatPanelLarge.width, height: chatPanelLarge.height }
  }
}

// TODO: modify to include an extra margin on all sides
export const constrainToWindow = (
  position: Position,
  dimensions: Dimensions
): Position => {
  const minX = 0 + extraMargins.left
  const minY = 0 + extraMargins.top
  const maxX = window.innerWidth - dimensions.width - extraMargins.right
  const maxY = window.innerHeight - dimensions.height - extraMargins.bottom

  let constrainedPosition = {
    left: position.left,
    top: position.top,
  }

  if (position.left < minX) constrainedPosition.left = minX
  if (position.left > maxX) constrainedPosition.left = maxX
  if (position.top < minY) constrainedPosition.top = minY
  if (position.top > maxY) constrainedPosition.top = maxY

  return constrainedPosition
}
