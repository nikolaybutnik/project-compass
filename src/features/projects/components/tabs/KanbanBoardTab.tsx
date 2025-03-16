import React, { useState } from 'react'
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  useColorModeValue,
  Center,
  Spinner,
  Button,
} from '@chakra-ui/react'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'

import { KanbanTask, Project } from '@/shared/types'
import { KanbanCard } from '@/features/projects/components/KanbanCard'
import {
  useAddTaskMutation,
  useDeleteTaskMutation,
} from '@/shared/store/projectsStore'

interface KanbanBoardTabProps {
  project: Project | undefined
  isLoading: boolean
  error: Error | null
}

export const KanbanBoardTab: React.FC<KanbanBoardTabProps> = ({
  project,
  isLoading,
  error,
}) => {
  const addTaskMutation = useAddTaskMutation()
  const deleteTaskMutation = useDeleteTaskMutation()
  const columnBg = useColorModeValue('gray.50', 'gray.700')

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

    console.log('active', active)

    for (const column of columns) {
      const task = column.tasks.find((t) => t.id === taskId)
      if (task) {
        setActivelyDraggedTask(task)
        break
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {}

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {columns?.map((column) => (
          <Box
            key={column?.id}
            id={`column-${column?.id}`}
            bg={columnBg}
            p={4}
            borderRadius='md'
            minH='400px'
          >
            <HStack justify='space-between' mb={4}>
              <Heading size='md' mb={4}>
                {column?.title}
              </Heading>
              <Button
                size='sm'
                colorScheme='blue'
                onClick={() => handleAddTask(column?.id)}
              >
                + Add
              </Button>
            </HStack>

            <SortableContext items={column?.tasks?.map((t) => t?.id) || []}>
              <VStack spacing={4} align='stretch'>
                {column?.tasks?.map((task) => (
                  <KanbanCard
                    key={task?.id}
                    task={task}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </VStack>
            </SortableContext>
          </Box>
        ))}
      </SimpleGrid>

      <DragOverlay>
        {activelyDraggedTask ? (
          <KanbanCard task={activelyDraggedTask} onDelete={handleDeleteTask} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
