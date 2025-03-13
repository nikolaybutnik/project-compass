import React from 'react'
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Center,
  Spinner,
  Button,
} from '@chakra-ui/react'
import { KanbanTask, Project } from '@/shared/types'
import { addTask, deleteTask } from '@/features/projects/services/tasksService'
interface KanbanBoardTabProps {
  project: Project | null
  isLoading: boolean
  error: Error | null
  onProjectUpdate: (updatedProject: Project) => void
}

export const KanbanBoardTab: React.FC<KanbanBoardTabProps> = ({
  project,
  isLoading,
  error,
  onProjectUpdate,
}) => {
  const columnBg = useColorModeValue('gray.50', 'gray.700')
  const cardBg = useColorModeValue('white', 'gray.600')

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
      const updatedProject = await addTask(project?.id, columnId, newTask)
      onProjectUpdate(updatedProject)
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const handleDeleteTask = async (
    columnId: string,
    taskId: string
  ): Promise<void> => {
    try {
      const updatedProject = await deleteTask(project?.id, columnId, taskId)
      onProjectUpdate(updatedProject)
    } catch (error) {
      console.error('Error deleting task', error)
    }
  }

  return (
    <Box>
      <Heading mb={6}>Project Kanban Board</Heading>
      <Text mb={8}>
        Drag and drop tasks between columns to update their status.
      </Text>

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
                <Box
                  key={task?.id}
                  p={4}
                  bg={cardBg}
                  borderRadius='md'
                  boxShadow='sm'
                  _hover={{ boxShadow: 'md' }}
                >
                  <HStack justify='space-between' mb={2}>
                    <Heading size='sm'>{task?.title}</Heading>
                    {task?.priority && (
                      <Badge
                        colorScheme={
                          task?.priority === 'high'
                            ? 'red'
                            : task?.priority === 'medium'
                              ? 'orange'
                              : 'green'
                        }
                      >
                        {task?.priority}
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize='sm' color='gray.500'>
                    {task?.description}
                  </Text>
                  <HStack mt={2} justify='flex-end'>
                    <Button
                      size='xs'
                      colorScheme='red'
                      variant='ghost'
                      onClick={() => handleDeleteTask(column?.id, task?.id)}
                    >
                      Delete
                    </Button>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )
}
