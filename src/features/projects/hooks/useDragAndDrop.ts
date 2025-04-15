import { useEffect, useReducer, useRef } from 'react'
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

  const taskToColumnMap = useRef(new Map<string, string>()).current

  useEffect(() => {
    taskToColumnMap.clear()
    columns.forEach((column) => {
      column.tasks.forEach((task) => {
        taskToColumnMap.set(task.id, column.id)
      })
    })
  }, [columns, taskToColumnMap])

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
    } = identifyDragElements(active, over, columns, dragState)

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
      dragState
    )

    if (sourceColumnId === targetColumnId) {
      if (dragState.preview) {
        throttledDispatch({ type: DragActionType.CLEAR_PREVIEWS })
      }
      return
    }

    if (dragState.preview?.targetColumnId === targetColumnId) {
      return
    }

    if (dragState.activeTask && targetColumnId) {
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

  const identifyDragElements = (
    active: Active,
    over: Over | null,
    columns: KanbanColumn[],
    dragState: DragState
  ): {
    activeTaskId: string
    sourceColumnId: string
    targetColumnId: string
    draggedOverTaskIndex: number
  } => {
    const activeTaskId = active.id?.toString()
    const sourceColumnId = dragState.activeTask?.columnId || ''

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

    const overId = over?.id?.toString()

    if (overId?.startsWith('column-')) {
      // Dragged directly over a column
      targetColumnId = overId?.replace('column-', '')
    } else if (overId?.startsWith('preview-')) {
      // Dragged over a preview element
      targetColumnId = dragState.preview?.targetColumnId || ''
    } else if (overId) {
      // Dragged over a task
      targetColumnId = taskToColumnMap.get(overId) || ''

      if (targetColumnId) {
        const column = columns.find((col) => col.id === targetColumnId)
        draggedOverTaskIndex =
          column?.tasks.findIndex((task) => task.id === overId) ?? -1
      }
    }

    return {
      activeTaskId,
      sourceColumnId,
      targetColumnId,
      draggedOverTaskIndex,
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
