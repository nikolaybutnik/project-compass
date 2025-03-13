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
} from '@chakra-ui/react'
import { KanbanColumn } from '@/shared/types'

// This is a simplified Kanban board without drag-and-drop functionality
// We'll enhance this later
export const KanbanBoardTab = () => {
  const columnBg = useColorModeValue('gray.50', 'gray.700')
  const cardBg = useColorModeValue('white', 'gray.600')

  // Sample data - will be replaced with real data later
  const columns: KanbanColumn[] = []

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
            <Heading size='md' mb={4}>
              {column.title}
            </Heading>
            <VStack spacing={4} align='stretch'>
              {column.tasks.map((task) => (
                <Box
                  // key={task.id}
                  p={4}
                  bg={cardBg}
                  borderRadius='md'
                  boxShadow='sm'
                  _hover={{ boxShadow: 'md' }}
                >
                  <HStack justify='space-between' mb={2}>
                    <Heading size='sm'>{task.title}</Heading>
                    {task.priority && (
                      <Badge
                        colorScheme={
                          task.priority === 'high'
                            ? 'red'
                            : task.priority === 'medium'
                              ? 'orange'
                              : 'green'
                        }
                      >
                        {task.priority}
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize='sm' color='gray.500'>
                    {task.description}
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )
}
