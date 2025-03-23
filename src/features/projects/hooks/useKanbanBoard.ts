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
  // State management
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [activelyDraggedTask, setActivelyDraggedTask] =
    useState<KanbanTask | null>(null)
  const draggedTaskForOverlay = useRef<KanbanTask | null>(null)
  const [localColumns, setLocalColumns] = useState<KanbanColumn[] | null>(null)

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
      const task = column?.tasks?.find((t) => t?.id === taskId)
      if (task) {
        setActivelyDraggedTask({ ...task, columnId: column.id })
        draggedTaskForOverlay.current = { ...task, columnId: column.id }
        break
      }
    }
  }

  const resetDragState = () => {
    setActivelyDraggedTask(null)
    draggedTaskForOverlay.current = null
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

  //   const handleDragOver = (event: DragOverEvent) => {
  // const { active, over } = event
  // if (!over || !active || !activelyDraggedTask) return
  // const activeTaskId = active?.id?.toString()
  // const overId = over?.id?.toString()
  // if (activeTaskId === overId) return
  // const isOverColumn = overId?.startsWith('column-')
  // const sourceColumnId = localColumns?.find((col) =>
  //   col?.tasks?.some((task) => task?.id === activeTaskId)
  // )?.id
  // const targetColumnId = isOverColumn
  //   ? overId?.replace('column-', '')
  //   : localColumns?.find((col) =>
  //       col?.tasks?.some((task) => task?.id === overId)
  //     )?.id
  // if (sourceColumnId === targetColumnId) return
  // // Update column preview if dragging between columns and over a task
  // if (sourceColumnId && targetColumnId) {
  //   const previewColumns = JSON.parse(JSON.stringify(localColumns))
  //   // Note: the objects found using the .find method are references to the original objects
  //   // in previewColumns, so mutating these affects the original.
  //   const sourceCol = previewColumns?.find(
  //     (col: KanbanColumn) => col.id === sourceColumnId
  //   )
  //   const targetCol = previewColumns?.find(
  //     (col: KanbanColumn) => col.id === targetColumnId
  //   )
  //   // Find and remove task from source
  //   const taskToMove = sourceCol?.tasks?.find(
  //     (t: KanbanTask) => t?.id === activeTaskId
  //   )
  //   sourceCol.tasks = sourceCol?.tasks?.filter(
  //     (t: KanbanTask) => t?.id !== activeTaskId
  //   )
  //   // Insert task at preview position or end of column
  //   if (!isOverColumn) {
  //     const overTaskIndex = targetCol?.tasks?.findIndex(
  //       (task: KanbanTask) => task?.id === overId
  //     )
  //     if (overTaskIndex !== -1) {
  //       targetCol.tasks.splice(overTaskIndex, 0, {
  //         ...taskToMove,
  //         columnId: targetColumnId,
  //       })
  //     } else {
  //       targetCol.tasks.push({ ...taskToMove, columnId: targetColumnId })
  //     }
  //   } else {
  //     targetCol.tasks.push({ ...taskToMove, columnId: targetColumnId })
  //   }
  //   setLocalColumns(previewColumns)
  // }
  //   }

  const handleDragOver = (event: DragOverEvent) => {}

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
