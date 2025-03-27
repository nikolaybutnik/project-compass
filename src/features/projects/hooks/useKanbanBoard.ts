import { useState, useRef, useEffect } from 'react'
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
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

export function useKanbanBoard(project: Project | undefined) {
  // Refs
  const previousTargetColRef = useRef<string | null>(null)

  // State management
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [activelyDraggedTask, setActivelyDraggedTask] =
    useState<KanbanTask | null>(null)
  const draggedTaskForOverlay = useRef<KanbanTask | null>(null)
  const [localColumns, setLocalColumns] = useState<KanbanColumn[]>([])

  // Tracks tasks that are being shown as previews when dragging a task.
  // Format: {taskId}-in-{columnId}
  const [dragPreviewItemIds, setDragPreviewItemIds] = useState<string[]>([])

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

  // Sync with project data
  useEffect(() => {
    if (project?.kanban?.columns && !isUpdating) {
      setLocalColumns(JSON.parse(JSON.stringify(project.kanban.columns)))
    }
  }, [project?.kanban?.columns, isUpdating])

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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const taskId = active?.id
    for (const column of localColumns || []) {
      const task = column?.tasks?.find((task) => task?.id === taskId)
      if (task) {
        setActivelyDraggedTask({ ...task, columnId: column.id })
        draggedTaskForOverlay.current = { ...task, columnId: column.id }
        break
      }
    }
  }

  const resetDragState = () => {
    setActivelyDraggedTask(null)
    setDragPreviewItemIds([])
    draggedTaskForOverlay.current = null
    previousTargetColRef.current = null
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
      if (col?.id === sourceColumnId) {
        return {
          ...col,
          tasks: col?.tasks?.filter((task) => task?.id !== taskId),
        }
      }

      if (col?.id === targetColumnId && activelyDraggedTask) {
        return {
          ...col,
          tasks: [
            ...col?.tasks,
            { ...activelyDraggedTask, columnId: targetColumnId },
          ],
        }
      }

      return col
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
    setDragPreviewItemIds([])

    const { active, over } = event

    if (!over || !activelyDraggedTask) {
      resetDragState()
      return
    }

    const {
      activeTaskId,
      sourceColumnId,
      targetColumnId,
      draggedOverTaskIndex,
    } = identifyDragElements(
      active,
      over,
      localColumns || [],
      activelyDraggedTask
    )

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

    resetDragState()
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over || !active || !activelyDraggedTask) return

    const activeTaskId = active?.id?.toString()
    const overId = over?.id?.toString()

    if (activeTaskId === overId) return

    const isOverColumn = overId?.startsWith('column-')
    const sourceColumnId = activelyDraggedTask?.columnId
    let targetColumnId: string = ''

    if (isOverColumn) {
      targetColumnId = overId?.replace('column-', '')
    } else {
      for (const column of localColumns || []) {
        if (column?.tasks?.some((task) => task?.id === overId)) {
          targetColumnId = column?.id
          break
        }
      }
    }

    if (
      previousTargetColRef.current &&
      previousTargetColRef.current !== targetColumnId
    ) {
      console.log('cleared preview')
      setDragPreviewItemIds([])
      // TODO: remove task from target column
    }

    const previewColumns: KanbanColumn[] = localColumns?.map((col) => ({
      ...col,
      tasks: [...col?.tasks],
    }))
    // const draggedTaskInOriginalColId = `${activeTaskId}-in-${sourceColumnId}`
    let draggedTaskId = `${activeTaskId}-in-${targetColumnId}`

    previousTargetColRef.current = targetColumnId

    if (sourceColumnId === targetColumnId) {
      setDragPreviewItemIds([draggedTaskId])
    } else if (sourceColumnId !== targetColumnId) {
      // When dragged task changes columns:
      // 1. setDragPreviewItemIds with new previewItemId
      // 2. Add task with previewItemId to previewColumns
      // 3. OPTIONALLY remove task from original column in previewColumns
      const targetCol = previewColumns?.find(
        (col) => col?.id === targetColumnId
      )
      setDragPreviewItemIds([draggedTaskId])
      // if (targetCol) {
      //   targetCol.tasks.push({
      //     ...activelyDraggedTask,
      //     columnId: targetColumnId,
      //   })
      // }
    }

    setLocalColumns(previewColumns)
  }

  const closeAddTaskModal = () => {
    setIsAddTaskModalOpen(false)
    setActiveColumnId(null)
  }

  return {
    // States
    columns: localColumns || [],
    isAddTaskModalOpen,
    activelyDraggedTask,
    activeColumnId,
    dragPreviewItemIds,

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
