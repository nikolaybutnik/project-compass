import { PointerSensor as LibPointerSensor } from '@dnd-kit/core'
import { PointerEvent } from 'react'

export class PointerSensor extends LibPointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: PointerEvent) => {
        return shouldHandleEvent(event.target as HTMLElement)
      },
    },
  ]
}

// Blocks the activation of dnd-kit if data-no-dnd="true" is set on the element. Affects children.
const shouldHandleEvent = (element: HTMLElement | null) => {
  let cur = element

  while (cur) {
    if (cur.dataset && cur.dataset.noDnd) {
      return false
    }
    cur = cur.parentElement
  }

  return true
}
