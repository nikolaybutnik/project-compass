import React, { useState } from 'react'
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
  closestCenter,
  defaultDropAnimationSideEffects,
  MeasuringStrategy,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'

import { KanbanTask, Project } from '@/shared/types'
import { KanbanCard } from '@/features/projects/components/kanban/KanbanCard'
import {
  useAddTaskMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,
} from '@/shared/store/projectsStore'
import { KanbanColumn } from '@/features/projects/components/kanban/KanbanColumn'

interface KanbanBoardTabProps {
  project: Project | undefined
  isLoading: boolean
  error: Error | null
}

// TODO: Consider putting interact buttons behind a modal, andfigure
// out how to handle card click which will eventually open an edit modal

export const KanbanBoardTab: React.FC<KanbanBoardTabProps> = ({
  project,
  isLoading,
  error,
}) => {
  const addTaskMutation = useAddTaskMutation()
  const deleteTaskMutation = useDeleteTaskMutation()
  const moveTaskMutation = useMoveTaskMutation()

  const [activelyDraggedTask, setActivelyDraggedTask] =
    useState<KanbanTask | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const columns = project?.kanban?.columns || []

  const handleAddTask = async (columnId: string): Promise<void> => {
    try {
      const newTask: Partial<KanbanTask> = {
        title: 'New Task Title',
        description: 'New Task Description',
        priority: 'medium',
        tags: ['frontend', 'backend'],
      }
      await addTaskMutation.mutateAsync({
        projectId: project?.id,
        columnId,
        taskData: newTask,
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

    for (const column of columns) {
      const task = column?.tasks?.find((t) => t?.id === taskId)
      if (task) {
        setActivelyDraggedTask(task)
        break
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !activelyDraggedTask) {
      setActivelyDraggedTask(null)
      return
    }

    const activeTaskId = active?.id?.toString()
    const draggedOverItemId = over?.id?.toString()
    let sourceColumnId: string | null = null
    let targetColumnId: string | null = null

    columns?.forEach((column) => {
      if (column?.tasks?.some((task) => task?.id === activeTaskId)) {
        sourceColumnId = column?.id
        return
      }
    })

    if (draggedOverItemId?.startsWith('column-')) {
      targetColumnId = draggedOverItemId.replace('column-', '')
    } else {
      columns?.forEach((column) => {
        if (column?.tasks?.some((task) => task?.id === draggedOverItemId)) {
          targetColumnId = column?.id
          return
        }
      })
    }

    if (sourceColumnId && targetColumnId && sourceColumnId !== targetColumnId) {
      moveTaskMutation.mutate({
        projectId: project?.id,
        sourceColumnId,
        targetColumnId,
        taskId: activeTaskId,
      })
    }

    setActivelyDraggedTask(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} h='100%'>
        {columns?.map((column) => (
          <KanbanColumn
            key={column?.id}
            column={column}
            onAddTask={handleAddTask}
          >
            <SortableContext items={column?.tasks?.map((t) => t?.id) || []}>
              <VStack spacing={4} align='stretch' flex='1' overflow='auto'>
                {column?.tasks?.map((task) => (
                  <KanbanCard
                    key={task?.id}
                    task={{ ...task, columnId: column.id }}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </VStack>
            </SortableContext>
          </KanbanColumn>
        ))}
      </SimpleGrid>

      <DragOverlay zIndex={999} dropAnimation={null}>
        {activelyDraggedTask ? (
          <KanbanCard task={activelyDraggedTask} onDelete={handleDeleteTask} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
