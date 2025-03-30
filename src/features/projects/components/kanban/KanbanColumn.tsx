import React from 'react'
import {
  Box,
  Button,
  Heading,
  HStack,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'
import { KanbanColumn as KanbanColumnType } from '@/shared/types'

interface KanbanColumnProps {
  column: KanbanColumnType
  onAddTask: (columnId: string) => void
  children: React.ReactNode
}

export const KanbanColumn: React.FC<KanbanColumnProps> = React.memo(
  ({
    column,
    onAddTask,
    children,
  }: {
    column: KanbanColumnType
    onAddTask: (columnId: string) => void
    children: React.ReactNode
  }) => {
    const columnBg = useColorModeValue('gray.200', 'gray.700')
    const { setNodeRef, isOver } = useDroppable({
      id: `column-${column?.id}`,
    })
    const borderColor = isOver
      ? useColorModeValue('blue.500', 'blue.300')
      : useColorModeValue('gray.200', 'gray.600')

    return (
      <Box
        ref={setNodeRef}
        id={`column-${column?.id}`}
        bg={columnBg}
        p={4}
        borderRadius='md'
        borderWidth='1px'
        borderStyle={isOver ? 'dashed' : 'solid'}
        borderColor={borderColor}
        display='flex'
        flexDirection='column'
        h='100%'
        minH='400px'
        transition='all 0.2s'
      >
        <HStack justify='space-between' mb={4}>
          <Heading size='md'>{column?.title}</Heading>
          <Button
            size='sm'
            colorScheme='blue'
            onClick={() => onAddTask(column?.id)}
          >
            + Add
          </Button>
        </HStack>

        <VStack spacing={4} align='stretch' flex='1' overflow='auto'>
          {children}
        </VStack>
      </Box>
    )
  }
)
