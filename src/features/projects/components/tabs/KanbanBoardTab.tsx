import React from 'react'
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
import { KanbanTask, Project } from '@/shared/types'
import { addTask, deleteTask } from '@/features/projects/services/tasksService'
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

  return (
    <Box>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {columns?.map((column) => (
          <Box
            key={column?.id}
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
            <VStack spacing={4} align='stretch'>
              {column?.tasks?.map((task) => (
                <KanbanCard
                  key={task?.id}
                  task={task}
                  onDelete={handleDeleteTask}
                />
              ))}
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )
}
