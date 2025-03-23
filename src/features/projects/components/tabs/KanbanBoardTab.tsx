import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Center,
  Spinner,
} from '@chakra-ui/react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  rectIntersection,
  defaultDropAnimationSideEffects,
  MeasuringStrategy,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import {
  KanbanTask,
  Project,
  KanbanColumn as KanbanColumnType,
} from '@/shared/types'
import { KanbanCard } from '@/features/projects/components/kanban/KanbanCard'
import {
  useAddTaskMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,
  useReorderTasksMutation,
} from '@/shared/store/projectsStore'
import { KanbanColumn } from '@/features/projects/components/kanban/KanbanColumn'
import { CreateTaskModal } from '@/features/projects/components/kanban/CreateTaskModal'
import { v4 as uuidv4 } from 'uuid'

interface KanbanBoardTabProps {
  project: Project | undefined
  isLoading: boolean
  error: Error | null
}

// TODO: figure out how to handle card click which will eventually open an edit modal

export const KanbanBoardTab: React.FC<KanbanBoardTabProps> = ({
  project,
  isLoading,
  error,
}) => {
  const addTaskMutation = useAddTaskMutation()
  const deleteTaskMutation = useDeleteTaskMutation()
  const moveTaskMutation = useMoveTaskMutation()
  const reorderTasksMutation = useReorderTasksMutation()

  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const [activelyDraggedTask, setActivelyDraggedTask] =
    useState<KanbanTask | null>(null)
  const draggedTaskForOverlay = useRef<KanbanTask | null>(null)
  const [localColumns, setLocalColumns] = useState<KanbanColumnType[] | null>(
    null
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (project?.kanban?.columns) {
      setLocalColumns(JSON.parse(JSON.stringify(project.kanban.columns)))
    }
  }, [project?.kanban?.columns])

  const displayColumns = localColumns || project?.kanban?.columns || []

  if (isLoading) {
    return (
      <Center h='400px'>
        <Spinner size='xl' />
      </Center>
    )
  }

  if (error) {
    return (
      <Box p={4} bg='red.100' color='red.800' borderRadius='md'>
        <Heading size='md'>Error Loading Kanban Board</Heading>
        <Text>{error.message}</Text>
      </Box>
    )
  }

  if (!project) {
    return <Text>No project data available.</Text>
  }

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
        projectId: project?.id,
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

    for (const column of displayColumns) {
      const task = column?.tasks?.find((t) => t?.id === taskId)
      if (task) {
        setActivelyDraggedTask(task)
        draggedTaskForOverlay.current = task
        break
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !activelyDraggedTask) {
      setActivelyDraggedTask(null)
      draggedTaskForOverlay.current = null
      return
    }

    const activeTaskId = active?.id?.toString()
    const draggedOverItemId = over?.id?.toString()
    let sourceColumnId: string | null = null
    let targetColumnId: string | null = null

    displayColumns?.forEach((column) => {
      if (column?.tasks?.some((task) => task?.id === activeTaskId)) {
        sourceColumnId = column?.id
        return
      }
    })

    if (draggedOverItemId?.startsWith('column-')) {
      targetColumnId = draggedOverItemId.replace('column-', '')
    } else {
      displayColumns?.forEach((column) => {
        if (column?.tasks?.some((task) => task?.id === draggedOverItemId)) {
          targetColumnId = column?.id
          return
        }
      })
    }

    if (sourceColumnId && targetColumnId && sourceColumnId !== targetColumnId) {
      const updatedColumns = localColumns?.map((column) => {
        if (column?.id === sourceColumnId) {
          return {
            ...column,
            tasks: column?.tasks?.filter((t) => t?.id !== activeTaskId),
          }
        }

        if (column?.id === targetColumnId && activelyDraggedTask) {
          return {
            ...column,
            tasks: [
              ...column?.tasks,
              { ...activelyDraggedTask, columnId: targetColumnId },
            ],
          }
        }

        return column
      })

      setLocalColumns(updatedColumns || [])

      moveTaskMutation.mutate(
        {
          projectId: project?.id,
          sourceColumnId,
          targetColumnId,
          taskId: activeTaskId,
        },
        {
          onSettled: () => {
            setActivelyDraggedTask(null)
            draggedTaskForOverlay.current = null
          },
        }
      )
    } else {
      const activeColumn = displayColumns?.find(
        (c) => c?.id === activelyDraggedTask?.columnId
      )
      const draggedOverTaskIndex = activeColumn?.tasks?.findIndex(
        (task) => task?.id === over?.id
      )

      if (draggedOverTaskIndex !== undefined && draggedOverTaskIndex !== -1) {
        if (localColumns && activelyDraggedTask) {
          const updatedColumns = localColumns.map((column) => {
            if (column?.id === activelyDraggedTask.columnId) {
              const currentTasks = [...column.tasks]
              const currentIndex = currentTasks.findIndex(
                (t) => t.id === activelyDraggedTask.id
              )

              if (currentIndex === -1) return column

              const [taskToMove] = currentTasks.splice(currentIndex, 1)

              currentTasks.splice(draggedOverTaskIndex, 0, taskToMove)

              return {
                ...column,
                tasks: currentTasks,
              }
            }
            return column
          })

          setLocalColumns(updatedColumns)
        }

        reorderTasksMutation.mutate(
          {
            projectId: project?.id,
            columnId: activelyDraggedTask?.columnId,
            taskId: activeTaskId,
            newIndex: draggedOverTaskIndex,
          },
          {
            onSettled: () => {
              setActivelyDraggedTask(null)
              draggedTaskForOverlay.current = null
            },
          }
        )
      }
    }

    setActivelyDraggedTask(null)
    draggedTaskForOverlay.current = null
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over || !active || !activelyDraggedTask) return

    const activeTaskId = active?.id?.toString()
    const overId = over?.id?.toString()

    if (activeTaskId === overId) return

    const isOverColumn = overId?.startsWith('column-')
    const sourceColumnId = localColumns?.find((col) =>
      col?.tasks?.some((task) => task?.id === activeTaskId)
    )?.id
    const targetColumnId = isOverColumn
      ? overId?.replace('column-', '')
      : localColumns?.find((col) =>
          col?.tasks?.some((task) => task?.id === overId)
        )?.id

    if (sourceColumnId === targetColumnId) return

    // Update column preview if dragging between columns and over a task
    if (sourceColumnId && targetColumnId) {
      const previewColumns = JSON.parse(JSON.stringify(localColumns))
      // Note: the objects found using the .find method are references to the original objects
      // in previewColumns, so mutating these affects the original.
      const sourceCol = previewColumns?.find(
        (col: KanbanColumnType) => col.id === sourceColumnId
      )
      const targetCol = previewColumns?.find(
        (col: KanbanColumnType) => col.id === targetColumnId
      )

      // Find and remove task from source
      const taskToMove = sourceCol?.tasks?.find(
        (t: KanbanTask) => t?.id === activeTaskId
      )
      sourceCol.tasks = sourceCol?.tasks?.filter(
        (t: KanbanTask) => t?.id !== activeTaskId
      )

      // Insert task at preview position or end of column
      if (!isOverColumn) {
        const overTaskIndex = targetCol?.tasks?.findIndex(
          (task: KanbanTask) => task?.id === overId
        )

        if (overTaskIndex !== -1) {
          targetCol.tasks.splice(overTaskIndex, 0, {
            ...taskToMove,
            columnId: targetColumnId,
          })
        } else {
          targetCol.tasks.push({ ...taskToMove, columnId: targetColumnId })
        }
      } else {
        targetCol.tasks.push({ ...taskToMove, columnId: targetColumnId })
      }

      setLocalColumns(previewColumns)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} h='100%'>
        {displayColumns.map((column) => (
          <KanbanColumn
            key={`column-${column?.id || Math.random()}`}
            column={column}
            onAddTask={() => handleAddTask(column?.id)}
          >
            <SortableContext
              items={column?.tasks?.map((t) => t?.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <VStack spacing={4} align='stretch' flex='1' overflow='auto'>
                {column?.tasks?.map((task) => (
                  <KanbanCard
                    key={`task-${task?.id || Math.random()}`}
                    task={{ ...task, columnId: column?.id }}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </VStack>
            </SortableContext>
          </KanbanColumn>
        ))}
      </SimpleGrid>

      <CreateTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => {
          setIsAddTaskModalOpen(false)
          setActiveColumnId(null)
        }}
        onSubmit={handleNewTaskSubmit}
      />

      <DragOverlay
        zIndex={999}
        dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.2, 0, 0.2, 1)',
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}
        style={{
          touchAction: 'none',
        }}
      >
        {activelyDraggedTask || draggedTaskForOverlay.current ? (
          <KanbanCard
            task={activelyDraggedTask || draggedTaskForOverlay.current!}
            onDelete={handleDeleteTask}
            isDragOverlay={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
