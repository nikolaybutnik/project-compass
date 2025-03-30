import { useReducer, useRef } from 'react'
import { KanbanTask, KanbanColumn } from '@/shared/types'
import { DragStartEvent } from '@dnd-kit/core'

export interface DragState {
  activeTask: KanbanTask | null
  dragPreviewItemIds: string[]
}

const initialDragState: DragState = {
  activeTask: null,
  dragPreviewItemIds: [],
}

type DragAction =
  | { type: 'START_DRAG'; payload: { task: KanbanTask } }
  | { type: 'CLEAR_PREVIEWS' }
  | { type: 'SET_PREVIEW'; payload: { previewId: string } }
  | { type: 'END_DRAG' }

function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.type) {
    case 'START_DRAG':
      return {
        ...state,
        activeTask: action.payload.task,
      }
    case 'CLEAR_PREVIEWS':
      return {
        ...state,
        dragPreviewItemIds: [],
      }
    case 'SET_PREVIEW':
      return {
        ...state,
        dragPreviewItemIds: [action.payload.previewId],
      }
    case 'END_DRAG':
      return {
        ...state,
        activeTask: null,
        dragPreviewItemIds: [],
      }
    default:
      return state
  }
}

export function useDragAndDrop(columns: KanbanColumn[] = []) {
  const [dragState, dispatch] = useReducer(dragReducer, initialDragState)
  const draggedTaskForOverlay = useRef<KanbanTask | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (!active) return

    const activeId = active.id.toString()

    const draggedTask = columns.reduce(
      (found, column) => {
        if (found) return found

        const task = column.tasks?.find((task) => task.id === activeId)
        return task ? { ...task, columnId: column.id } : null
      },
      null as KanbanTask | null
    )

    if (draggedTask) {
      dispatch({ type: 'START_DRAG', payload: { task: draggedTask } })
      draggedTaskForOverlay.current = draggedTask
    }
  }

  const resetDragState = () => {
    dispatch({ type: 'END_DRAG' })
    draggedTaskForOverlay.current = null
  }

  return {
    state: dragState,
    overlay: draggedTaskForOverlay,
    handlers: {
      handleDragStart,
      handleDragOver: () => {},
      handleDragEnd: () => {},
      resetDragState,
    },
    dispatch,
  }
}
