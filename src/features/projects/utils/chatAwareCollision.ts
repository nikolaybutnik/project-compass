import { CollisionDetection, rectIntersection } from '@dnd-kit/core'

export const chatAwareCollision: CollisionDetection = (args) => {
  const { pointerCoordinates } = args

  if (pointerCoordinates) {
    const { x, y } = pointerCoordinates
    const elementsToCheck = [
      document.querySelector('.chat-panel'),
      document.querySelector('.chat-bubble'),
    ].filter(Boolean)

    const isOverProtectedElement = elementsToCheck.some((element) => {
      const rect = (element as HTMLElement).getBoundingClientRect()
      return (
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
      )
    })

    if (isOverProtectedElement) {
      return []
    }
  }

  return rectIntersection(args)
}
