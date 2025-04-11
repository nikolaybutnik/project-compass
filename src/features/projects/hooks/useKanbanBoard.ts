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
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [localColumns, setLocalColumns] = useState<KanbanColumn[]>([])

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

  // Updates UI with task previews during drag operations for immediate visual feedback
  // Avoid reliance on localColumns to avoid unnecessary re-renders
  useEffect(() => {
    if (!localColumns.length) return

    setLocalColumns((currentColumns) => {
      const cleanColumns = removePreviewTasks(currentColumns)

      if (dragState.preview) {
        return cleanColumns.map((col) => {
          if (col.id === dragState.preview?.targetColumnId) {
            return {
              ...col,
              tasks: [...col.tasks, dragState.preview.task],
            }
          }
          return col
        })
      } else {
        return cleanColumns
      }
    })
  }, [dragState.preview, removePreviewTasks])

  const handleAddTask = useCallback(async (columnId: string): Promise<void> => {
    setActiveColumnId(columnId)
    setIsAddTaskModalOpen(true)
  }, [])

  const handleNewTaskSubmit = useCallback(
    async (taskData: Partial<KanbanTask>) => {
      try {
        await addTaskMutation.mutateAsync({
          projectId: project?.id || '',
          columnId: activeColumnId || '',
          taskData: taskData,
        })
      } catch (error) {
        console.error('Error adding task:', error)
      }
    },
    [project?.id, activeColumnId, addTaskMutation]
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
    },
    [
      project?.id,
      localColumns,
      dragState.activeTask,
      removePreviewTasks,
      moveTaskMutation,
    ]
  )

  const handleWithinColumnReorder = useCallback(
    (columnId: string, taskId: string, newIndex: number) => {
      const cleanCols = removePreviewTasks(localColumns)
      const column = cleanCols.find((col) => col.id === columnId)

      if (!column) return

      const currentIndex = column.tasks.findIndex((task) => task.id === taskId)

      if (currentIndex === -1) return

      if (currentIndex === newIndex) return

      setIsUpdating(true)

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
    },
    [project?.id, localColumns, removePreviewTasks, reorderTasksMutation]
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

  const closeAddTaskModal = useCallback(() => {
    setIsAddTaskModalOpen(false)
    setActiveColumnId(null)
  }, [])

  return useMemo(
    () => ({
      // States
      columns: localColumns || [],
      isAddTaskModalOpen,
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

      // Modal handlers
      closeAddTaskModal,
    }),
    [
      localColumns,
      isAddTaskModalOpen,
      dragState,
      draggedTaskForOverlay,
      sensors,
      dndHandlers,
      handleDragEnd,
      handleAddTask,
      handleNewTaskSubmit,
      handleDeleteTask,
      closeAddTaskModal,
    ]
  )
}
