import { useRef, useEffect } from 'react'

export function useRenderCount(componentName: string) {
  const count = useRef(0)

  useEffect(() => {
    count.current += 1
    console.log(`${componentName} render #${count.current}`)
  })

  return count.current
}
