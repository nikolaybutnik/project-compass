import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'

import { KanbanTask, Project, KanbanColumn } from '@/shared/types'
import {
  useAddTaskMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,
  useReorderTasksMutation,
} from '@/shared/store/projectsStore'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import {
  DragState,
  useDragAndDrop,
} from '@/features/projects/hooks/useDragAndDrop'

interface TaskDragInfo {
  key: string
  isPreview: boolean
  isCrossColumnSource: boolean
}

export function useKanbanBoard(project: Project | undefined) {
  // State management
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [localColumns, setLocalColumns] = useState<KanbanColumn[]>([])

  const {
    state: dragState,
    overlay: draggedTaskForOverlay,
    handlers: { handleDragStart, resetDragState, identifyDragElements },
    dispatch,
  } = useDragAndDrop(localColumns)

  // Mutations
  const addTaskMutation = useAddTaskMutation()
  const deleteTaskMutation = useDeleteTaskMutation()
  const moveTaskMutation = useMoveTaskMutation()
  const reorderTasksMutation = useReorderTasksMutation()

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const lastDragTimeRef = useRef(0)

  useEffect(() => {
    if (!project?.kanban.columns || isUpdating) return

    setLocalColumns(
      project.kanban.columns.map((column) => ({
        ...column,
        tasks: column.tasks.length
          ? column.tasks.map((task) => ({ ...task }))
          : [],
      }))
    )
  }, [project?.kanban.columns, isUpdating])

  const removePreviewTasks = useCallback(
    (columns: KanbanColumn[]): KanbanColumn[] =>
      columns.map((col) => ({
        ...col,
        tasks: col.tasks.filter(
          (task) => !task?.id?.toString()?.startsWith('preview-')
        ),
      })),
    []
  )

  const cleanColumns = useMemo(
    () => removePreviewTasks(localColumns),
    [localColumns, removePreviewTasks]
  )

  const handleAddTask = async (columnId: string): Promise<void> => {
    setActiveColumnId(columnId)
    setIsAddTaskModalOpen(true)
  }

  const handleNewTaskSubmit = async (taskData: Partial<KanbanTask>) => {
    try {
      await addTaskMutation.mutateAsync({
        projectId: project?.id || '',
        columnId: activeColumnId || '',
        taskData: taskData,
      })
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const handleDeleteTask = async (
    columnId: string,
    taskId: string
  ): Promise<void> => {
    try {
      await deleteTaskMutation.mutateAsync({
        projectId: project?.id || '',
        columnId,
        taskId,
      })
    } catch (error) {
      console.error('Error deleting task', error)
    }
  }

  const handleCrossColumnMove = (
    sourceColumnId: string,
    targetColumnId: string,
    taskId: string
  ) => {
    setIsUpdating(true)

    const cleanCols = removePreviewTasks(localColumns)
    const updatedColumns = cleanCols.map((col) => {
      if (col?.id === sourceColumnId) {
        return {
          ...col,
          tasks: col.tasks.filter((task) => task.id !== taskId),
        }
      }

      if (col?.id === targetColumnId && dragState.activeTask) {
        return {
          ...col,
          tasks: [
            ...col.tasks,
            { ...dragState.activeTask, columnId: targetColumnId },
          ],
        }
      }

      return col
    })

    setLocalColumns(updatedColumns)

    moveTaskMutation.mutate(
      {
        projectId: project?.id || '',
        sourceColumnId,
        targetColumnId,
        taskId,
      },
      {
        onSettled: () => {
          setIsUpdating(false)
        },
      }
    )
  }

  const handleWithinColumnReorder = (
    columnId: string,
    taskId: string,
    newIndex: number
  ) => {
    setIsUpdating(true)

    const cleanCols = removePreviewTasks(localColumns)
    const updatedColumns = cleanCols.map((col) => {
      if (col?.id === columnId) {
        const currentTasks = [...col.tasks]
        const startingTaskIndex = currentTasks.findIndex(
          (task) => task.id === taskId
        )

        if (startingTaskIndex !== -1) {
          const [taskToMove] = currentTasks.splice(startingTaskIndex, 1)
          currentTasks.splice(newIndex, 0, taskToMove)

          return {
            ...col,
            tasks: currentTasks,
          }
        }
      }

      return col
    })

    setLocalColumns(updatedColumns)

    reorderTasksMutation.mutate(
      {
        projectId: project?.id || '',
        columnId,
        taskId,
        newIndex,
      },
      {
        onSettled: () => {
          setIsUpdating(false)
        },
      }
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    resetDragState()

    if (!over || !dragState.activeTask) return

    const {
      activeTaskId,
      sourceColumnId,
      targetColumnId,
      draggedOverTaskIndex,
    } = identifyDragElements(active, over, localColumns, dragState.activeTask)

    if (!sourceColumnId || !targetColumnId) return

    if (sourceColumnId !== targetColumnId) {
      handleCrossColumnMove(sourceColumnId, targetColumnId, activeTaskId)
    } else if (draggedOverTaskIndex !== -1) {
      handleWithinColumnReorder(
        sourceColumnId,
        activeTaskId,
        draggedOverTaskIndex
      )
    }
  }

  const updateTargetColumnWithPreview = useCallback(
    (targetColumnId: string, previewTask: KanbanTask) => {
      setLocalColumns((prevColumns) => {
        const cleanCols = removePreviewTasks(prevColumns)

        return cleanCols.map((col) => {
          if (col.id === targetColumnId) {
            return {
              ...col,
              tasks: [...col.tasks, previewTask],
            }
          }
          return col
        })
      })
    },
    [removePreviewTasks]
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent): void => {
      // Throttle
      const now = Date.now()
      if (now - lastDragTimeRef.current < 45) {
        return
      }
      lastDragTimeRef.current = now

      const { active, over } = event
      if (!active || !dragState.activeTask) return

      if (!over) {
        dispatch({ type: 'CLEAR_PREVIEWS' })
        setLocalColumns(cleanColumns)
        return
      }

      const activeTaskId = active.id.toString()
      const overId = over.id.toString()
      const sourceColumnId = dragState.activeTask.columnId
      const isOverOriginalPosition = activeTaskId === overId

      const targetColumnId = overId.startsWith('column-')
        ? overId.replace('column-', '')
        : localColumns.find((column) =>
            column.tasks.some((task) => task.id === overId)
          )?.id || ''

      dispatch({ type: 'CLEAR_PREVIEWS' })

      if (
        !targetColumnId ||
        sourceColumnId === targetColumnId ||
        isOverOriginalPosition
      ) {
        setLocalColumns(cleanColumns)
        return
      }

      if (dragState.activeTask) {
        const previewTask = {
          ...dragState.activeTask,
          id: `preview-${dragState.activeTask.id}`,
          columnId: targetColumnId,
        }

        updateTargetColumnWithPreview(targetColumnId, previewTask)

        dispatch({
          type: 'SET_PREVIEW',
          payload: {
            previewId: `preview-${dragState.activeTask.id}-in-${targetColumnId}`,
          },
        })
      }
    },
    [
      dragState.activeTask,
      localColumns,
      dispatch,
      cleanColumns,
      updateTargetColumnWithPreview,
    ]
  )

  const closeAddTaskModal = () => {
    setIsAddTaskModalOpen(false)
    setActiveColumnId(null)
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
    // States
    columns: localColumns || [],
    isAddTaskModalOpen,
    dragState,
    draggedTaskForOverlay,

    // DND handlers
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,

    // Task operations
    handleAddTask,
    handleNewTaskSubmit,
    handleDeleteTask,
    getDragStateInfo,

    // Modal handlers
    closeAddTaskModal,
  }
}
