import { useState, useEffect, useMemo } from 'react'
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  Active,
  Over,
} from '@dnd-kit/core'

import { KanbanTask, Project, KanbanColumn } from '@/shared/types'
import {
  useAddTaskMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,
  useReorderTasksMutation,
} from '@/shared/store/projectsStore'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useDragAndDrop } from './useDragAndDrop'

export function useKanbanBoard(project: Project | undefined) {
  // State management
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [localColumns, setLocalColumns] = useState<KanbanColumn[]>([])

  const {
    state: dragState,
    overlay: draggedTaskForOverlay,
    handlers: { handleDragStart, resetDragState },
    dispatch,
  } = useDragAndDrop(localColumns)

  // Mutations
  const addTaskMutation = useAddTaskMutation()
  const deleteTaskMutation = useDeleteTaskMutation()
  const moveTaskMutation = useMoveTaskMutation()
  const reorderTasksMutation = useReorderTasksMutation()

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (project?.kanban?.columns && !isUpdating) {
      setLocalColumns(JSON.parse(JSON.stringify(project.kanban.columns)))
    }
  }, [project?.kanban?.columns, isUpdating])

  const cleanColumns = useMemo(() => {
    return localColumns?.map((col) => ({
      ...col,
      tasks: col?.tasks?.filter(
        (task) => !task?.id?.toString()?.startsWith('preview-')
      ),
    }))
  }, [localColumns])

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
    const draggedOverItemId = over?.id?.toString()
    const sourceColumnId = draggedTask.columnId

    let targetColumnId: string = ''
    let draggedOverTaskIndex: number = -1

    if (draggedOverItemId?.startsWith('column-')) {
      targetColumnId = draggedOverItemId?.replace('column-', '')
    } else {
      for (const column of columns) {
        const taskIndex = column?.tasks?.findIndex(
          (task: KanbanTask) => task?.id === draggedOverItemId
        )
        if (taskIndex !== -1) {
          targetColumnId = column?.id
          draggedOverTaskIndex = taskIndex
          break
        }
      }
    }

    return {
      activeTaskId,
      sourceColumnId,
      targetColumnId: targetColumnId,
      draggedOverTaskIndex: draggedOverTaskIndex,
    }
  }

  const handleCrossColumnMove = (
    sourceColumnId: string,
    targetColumnId: string,
    taskId: string
  ) => {
    setIsUpdating(true)

    const updatedColumns = localColumns?.map((col) => {
      // Remove any preview tasks from all columns
      const filteredTasks = col?.tasks?.filter(
        (task) => !task?.id?.toString()?.startsWith('preview-')
      )

      if (col?.id === sourceColumnId) {
        return {
          ...col,
          tasks: filteredTasks.filter((task) => task?.id !== taskId),
        }
      }

      if (col?.id === targetColumnId && dragState.activeTask) {
        return {
          ...col,
          tasks: [
            ...filteredTasks,
            { ...dragState.activeTask, columnId: targetColumnId },
          ],
        }
      }

      return { ...col, tasks: filteredTasks }
    })

    setLocalColumns(updatedColumns || [])

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

    const updatedColumns = localColumns?.map((col) => {
      if (col?.id === columnId) {
        const currentTasks = [...col?.tasks]
        const startingTaskIndex = currentTasks?.findIndex(
          (task) => task?.id === taskId
        )

        if (startingTaskIndex !== -1) {
          const [taskToMove] = currentTasks?.splice(startingTaskIndex, 1)
          currentTasks?.splice(newIndex, 0, taskToMove)

          return {
            ...col,
            tasks: currentTasks,
          }
        }
      }

      return col
    })

    setLocalColumns(updatedColumns || [])

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

    if (sourceColumnId && targetColumnId && sourceColumnId !== targetColumnId) {
      handleCrossColumnMove(sourceColumnId, targetColumnId, activeTaskId)
    } else if (
      sourceColumnId === targetColumnId &&
      draggedOverTaskIndex !== undefined
    ) {
      handleWithinColumnReorder(
        sourceColumnId,
        activeTaskId,
        draggedOverTaskIndex
      )
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || !active || !dragState.activeTask) return

    const activeTaskId = active.id.toString()
    const overId = over.id.toString()
    const sourceColumnId = dragState.activeTask.columnId
    const isOverOriginalPosition = activeTaskId === overId

    const targetColumnId = overId.startsWith('column-')
      ? overId.replace('column-', '')
      : localColumns.find((column) =>
          column.tasks?.some((task) => task.id === overId)
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

    const targetCol = cleanColumns?.find((col) => col.id === targetColumnId)
    if (targetCol && dragState.activeTask) {
      const previewTask = {
        ...dragState.activeTask,
        id: `preview-${dragState.activeTask.id}`,
        columnId: targetColumnId,
      }

      // TODO: instead of pushing, insert and live preview the tasks
      targetCol.tasks.push(previewTask)

      dispatch({
        type: 'SET_PREVIEW',
        payload: {
          previewId: `preview-${dragState.activeTask.id}-in-${targetColumnId}`,
        },
      })
    }

    setLocalColumns(cleanColumns)
  }

  const closeAddTaskModal = () => {
    setIsAddTaskModalOpen(false)
    setActiveColumnId(null)
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

    // Modal handlers
    closeAddTaskModal,
  }
}
