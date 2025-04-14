import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'

import { KanbanTask, Project, KanbanColumn } from '@/shared/types'
import {
  useAddTaskMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,
  useReorderTasksMutation,
} from '@/shared/store/projectsStore'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useDragAndDrop } from '@/features/projects/hooks/useDragAndDrop'

/**
 * useKanbanBoard - Business logic
 * SHOULD handle:
 * - Columns/tasks data management
 * - API/mutation calls
 * - UI state (modals, loading)
 * - Business rules for task movement
 *
 * SHOULD NOT handle:
 * - Raw drag event processing
 * - Throttling
 * - Drag state management
 */
export function useKanbanBoard(project: Project | undefined) {
  // State management
  const [isUpdating, setIsUpdating] = useState(false)
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [localColumns, setLocalColumns] = useState<KanbanColumn[]>([])
  const [previewTask, setPreviewTask] = useState<{
    task: KanbanTask
    targetColumnId: string
  } | null>(null)

  const {
    state: dragState,
    overlay: draggedTaskForOverlay,
    handlers: dndHandlers,
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

  useEffect(() => {
    if (!localColumns.length) return

    if (dragState.preview) {
      setPreviewTask({
        task: dragState.preview.task,
        targetColumnId: dragState.preview.targetColumnId,
      })
    } else {
      setPreviewTask(null)
    }
  }, [dragState.preview, localColumns])

  const columnsWithPreview = useMemo(() => {
    if (!previewTask) return localColumns

    return localColumns.map((col) => {
      if (col.id === previewTask.targetColumnId) {
        return {
          ...col,
          tasks: [...col.tasks, previewTask.task],
        }
      }
      return col
    })
  }, [localColumns, previewTask])

  const handleAddTask = useCallback(async (columnId: string): Promise<void> => {
    setActiveColumnId(columnId)
    setIsTaskDrawerOpen(true)
  }, [])

  const handleNewTaskSubmit = useCallback(
    async (taskData: Partial<KanbanTask>, columnId: string) => {
      try {
        await addTaskMutation.mutateAsync({
          projectId: project?.id || '',
          columnId,
          taskData: taskData,
        })
      } catch (error) {
        console.error('Error adding task:', error)
      }
    },
    [project?.id, addTaskMutation]
  )

  const handleDeleteTask = useCallback(
    async (columnId: string, taskId: string): Promise<void> => {
      try {
        await deleteTaskMutation.mutateAsync({
          projectId: project?.id || '',
          columnId,
          taskId,
        })
      } catch (error) {
        console.error('Error deleting task', error)
      }
    },
    [project?.id, deleteTaskMutation]
  )

  const handleCrossColumnMove = useCallback(
    (sourceColumnId: string, targetColumnId: string, taskId: string) => {
      setIsUpdating(true)

      const updatedColumns = localColumns.map((col) => {
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

      setPreviewTask(null)
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
    },
    [project?.id, localColumns, dragState.activeTask, moveTaskMutation]
  )

  const handleWithinColumnReorder = useCallback(
    (columnId: string, taskId: string, newIndex: number) => {
      const column = localColumns.find((col) => col.id === columnId)

      if (!column) return

      const currentIndex = column.tasks.findIndex((task) => task.id === taskId)

      if (currentIndex === -1) return

      if (currentIndex === newIndex) return

      setIsUpdating(true)

      const updatedColumns = localColumns.map((col) => {
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
    },
    [project?.id, localColumns, reorderTasksMutation]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent): void => {
      dndHandlers.handleDragEnd(event, {
        onCrossColumnMove: handleCrossColumnMove,
        onWithinColumnReorder: handleWithinColumnReorder,
      })
    },
    [dndHandlers, handleCrossColumnMove, handleWithinColumnReorder]
  )

  const closeTaskDrawer = useCallback(() => {
    setIsTaskDrawerOpen(false)
    setActiveColumnId(null)
  }, [])

  return useMemo(
    () => ({
      // States
      columns: columnsWithPreview || [],
      isTaskDrawerOpen,
      activeColumnId,
      dragState,
      draggedTaskForOverlay,

      // DND handlers
      sensors,
      handleDragStart: dndHandlers.handleDragStart,
      handleDragOver: dndHandlers.handleDragOver,
      handleDragEnd,
      getDragStateInfo: dndHandlers.getDragStateInfo,

      // Task operations
      handleAddTask,
      handleNewTaskSubmit,
      handleDeleteTask,

      // Drawer handlers
      closeTaskDrawer,
    }),
    [
      columnsWithPreview,
      isTaskDrawerOpen,
      activeColumnId,
      dragState,
      draggedTaskForOverlay,
      sensors,
      dndHandlers,
      handleDragEnd,
      handleAddTask,
      handleNewTaskSubmit,
      handleDeleteTask,
      closeTaskDrawer,
    ]
  )
}
