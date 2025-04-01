import { useReducer, useRef } from 'react'
import { KanbanTask, KanbanColumn } from '@/shared/types'
import {
  Active,
  DragStartEvent,
  Over,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'

export interface DragState {
  activeTask: KanbanTask | null
  dragPreviewItemIds: string[]
}

export interface DragEndCallbacks {
  onCrossColumnMove: (
    sourceColumnId: string,
    targetColumnId: string,
    taskId: string
  ) => void
  onWithinColumnReorder: (
    columnId: string,
    taskId: string,
    newIndex: number
  ) => void
}

export interface DragOverCallbacks {
  onColumnPreview: (targetColumnId: string, task: KanbanTask) => void
  onClearPreviews: () => void
}

interface TaskDragInfo {
  key: string
  isPreview: boolean
  isCrossColumnSource: boolean
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

const identifyDragElements = (
  active: Active,
  over: Over | null,
  columns: KanbanColumn[],
  draggedTask: KanbanTask
): {
  activeTaskId: string
  sourceColumnId: string
  targetColumnId: string
  draggedOverTaskIndex: number
} => {
  const activeTaskId = active?.id?.toString()
  const sourceColumnId = draggedTask.columnId

  let targetColumnId: string = ''
  let draggedOverTaskIndex: number = -1

  if (!over) {
    return {
      activeTaskId,
      sourceColumnId,
      targetColumnId,
      draggedOverTaskIndex,
    }
  }

  const draggedOverItemId = over?.id?.toString()

  if (draggedOverItemId?.startsWith('column-')) {
    targetColumnId = draggedOverItemId?.replace('column-', '')
  } else {
    const targetColumn = columns.find((column) =>
      column.tasks.some((task) => task.id === draggedOverItemId)
    )

    if (targetColumn) {
      targetColumnId = targetColumn.id
      draggedOverTaskIndex = targetColumn.tasks.findIndex(
        (task) => task.id === draggedOverItemId
      )
    }
  }

  return {
    activeTaskId,
    sourceColumnId,
    targetColumnId,
    draggedOverTaskIndex,
  }
}

/**
 * This hook is used to manage the drag and drop functionality for the Kanban board.
 * Focus is on drag-and-drop mechanics and state.
 */
export function useDragAndDrop(columns: KanbanColumn[] = []) {
  const [dragState, dispatch] = useReducer(dragReducer, initialDragState)
  const draggedTaskForOverlay = useRef<KanbanTask | null>(null)

  const handleDragStart = (event: DragStartEvent): void => {
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

  const handleDragEnd = (
    event: DragEndEvent,
    callbacks: DragEndCallbacks
  ): void => {
    const { active, over } = event

    resetDragState()

    if (!over || !dragState.activeTask) return

    const {
      activeTaskId,
      sourceColumnId,
      targetColumnId,
      draggedOverTaskIndex,
    } = identifyDragElements(active, over, columns, dragState.activeTask)

    if (!sourceColumnId || !targetColumnId) return

    if (sourceColumnId !== targetColumnId) {
      callbacks.onCrossColumnMove(sourceColumnId, targetColumnId, activeTaskId)
    } else if (draggedOverTaskIndex !== -1) {
      callbacks.onWithinColumnReorder(
        sourceColumnId,
        activeTaskId,
        draggedOverTaskIndex
      )
    }
  }

  const handleDragOver = (
    event: DragOverEvent,
    callbacks: DragOverCallbacks
  ): void => {
    const { active, over } = event
    if (!active || !dragState.activeTask) return

    if (!over) {
      dispatch({ type: 'CLEAR_PREVIEWS' })
      callbacks.onClearPreviews()
      return
    }

    const { sourceColumnId, targetColumnId } = identifyDragElements(
      active,
      over,
      columns,
      dragState.activeTask
    )

    if (sourceColumnId === targetColumnId) {
      dispatch({ type: 'CLEAR_PREVIEWS' })
      callbacks.onClearPreviews()
      return
    }

    if (dragState.activeTask) {
      dispatch({
        type: 'SET_PREVIEW',
        payload: {
          previewId: `preview-${dragState.activeTask.id}-in-${targetColumnId}`,
        },
      })
      callbacks.onColumnPreview(targetColumnId, dragState.activeTask)
    }
  }

  const resetDragState = (): void => {
    dispatch({ type: 'END_DRAG' })
    draggedTaskForOverlay.current = null
  }

  const getDragStateInfo = (
    task: KanbanTask,
    columnId: string,
    dragState: DragState
  ): TaskDragInfo => {
    const isActiveTask = dragState.activeTask?.id === task.id
    const isActiveTaskColumn = dragState.activeTask?.columnId === columnId

    const isCrossColumnSource =
      isActiveTask &&
      isActiveTaskColumn &&
      dragState.dragPreviewItemIds.some((id) =>
        id.includes(`preview-${dragState.activeTask?.id}-in-`)
      )

    const isPreview =
      // Preview in same column, but NOT the source card
      (isActiveTask && isActiveTaskColumn && !isCrossColumnSource) ||
      // Preview in another column
      dragState.dragPreviewItemIds.includes(`${task.id}-in-${columnId}`)

    return {
      key: `${isPreview ? 'preview-' : ''}${task.id}-in-${columnId}`,
      isPreview,
      isCrossColumnSource,
    }
  }

  return {
    state: dragState,
    overlay: draggedTaskForOverlay,
    handlers: {
      handleDragStart,
      handleDragOver,
      handleDragEnd,
      resetDragState,
      getDragStateInfo,
    },
    dispatch,
  }
}
