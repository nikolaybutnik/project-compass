import { useReducer, useRef } from 'react'
import { KanbanTask, KanbanColumn } from '@/shared/types'
import {
  Active,
  DragStartEvent,
  Over,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import { throttle } from 'lodash'

export interface DragState {
  activeTask: KanbanTask | null
  preview: {
    id: string
    task: KanbanTask
    targetColumnId: string
  } | null
  isDragInProgress: boolean
}

export interface DragStartCallbacks {
  onTaskDragStart?: (task: KanbanTask) => void
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

interface TaskDragInfo {
  key: string
  isPreview: boolean
  isCrossColumnSource: boolean
}

const initialDragState: DragState = {
  activeTask: null,
  preview: null,
  isDragInProgress: false,
}

enum DragActionType {
  START_DRAG = 'START_DRAG',
  CLEAR_PREVIEWS = 'CLEAR_PREVIEWS',
  SET_PREVIEW = 'SET_PREVIEW',
  END_DRAG = 'END_DRAG',
}

type DragAction =
  | { type: DragActionType.START_DRAG; payload: { task: KanbanTask } }
  | { type: DragActionType.CLEAR_PREVIEWS }
  | {
      type: DragActionType.SET_PREVIEW
      payload: {
        previewId: string
        previewTask: KanbanTask
        targetColumnId: string
      }
    }
  | { type: DragActionType.END_DRAG }

const dragReducer = (state: DragState, action: DragAction): DragState => {
  switch (action.type) {
    case DragActionType.START_DRAG:
      return {
        ...state,
        activeTask: action.payload.task,
        isDragInProgress: true,
      }
    case DragActionType.CLEAR_PREVIEWS:
      return {
        ...state,
        preview: null,
      }
    case DragActionType.SET_PREVIEW:
      return {
        ...state,
        preview: {
          id: action.payload.previewId,
          task: action.payload.previewTask,
          targetColumnId: action.payload.targetColumnId,
        },
      }
    case DragActionType.END_DRAG:
      return initialDragState
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
 * useDragAndDrop - Core drag mechanics
 * SHOULD handle:
 * - Drag state management (active item, previews)
 * - All drag event processing
 * - Throttling of events
 * - Drag detection and visualization logic
 *
 * SHOULD NOT handle:
 * - API calls
 * - Business logic
 * - Columns data structure
 */
export const useDragAndDrop = (columns: KanbanColumn[] = []) => {
  const [dragState, dispatch] = useReducer(dragReducer, initialDragState)
  const draggedTaskForOverlay = useRef<KanbanTask | null>(null)

  const throttledDispatch = useRef(
    throttle((action: DragAction) => {
      dispatch(action)
    }, 50)
  ).current

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
      dispatch({
        type: DragActionType.START_DRAG,
        payload: { task: draggedTask },
      })
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

  const handleDragOver = (event: DragOverEvent): void => {
    const { active, over } = event
    if (!active || !dragState.activeTask) return

    if (!over) {
      throttledDispatch({ type: DragActionType.CLEAR_PREVIEWS })
      return
    }

    const { sourceColumnId, targetColumnId } = identifyDragElements(
      active,
      over,
      columns,
      dragState.activeTask
    )

    if (dragState.preview?.targetColumnId === targetColumnId) return

    if (sourceColumnId === targetColumnId) {
      throttledDispatch({ type: DragActionType.CLEAR_PREVIEWS })
      return
    }

    if (dragState.activeTask) {
      const previewTask = {
        ...dragState.activeTask,
        id: `preview-${dragState.activeTask.id}`,
        columnId: targetColumnId,
      }

      throttledDispatch({
        type: DragActionType.SET_PREVIEW,
        payload: {
          previewId: `preview-${dragState.activeTask.id}-in-${targetColumnId}`,
          previewTask,
          targetColumnId,
        },
      })
    }
  }

  const resetDragState = (): void => {
    dispatch({ type: DragActionType.END_DRAG })
    draggedTaskForOverlay.current = null
  }

  const getDragStateInfo = (
    task: KanbanTask,
    columnId: string,
    dragState: DragState
  ): TaskDragInfo => {
    const isActiveTask = dragState.activeTask?.id === task.id
    const isActiveTaskColumn = dragState.activeTask?.columnId === columnId

    const hasPreviewInOtherColumn =
      dragState.preview !== null &&
      dragState.preview.targetColumnId !== dragState.activeTask?.columnId

    const isCrossColumnSource =
      isActiveTask && isActiveTaskColumn && hasPreviewInOtherColumn

    const isPreview =
      // Cross-column preview task
      (dragState.preview?.task.id === task.id &&
        dragState.preview?.targetColumnId === columnId) ||
      // Within-column active task (should be blue)
      (isActiveTask && isActiveTaskColumn && !hasPreviewInOtherColumn)

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
  }
}
