import React from 'react'
import {
  Box,
  Button,
  Heading,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'
import { KanbanColumn as KanbanColumnType } from '@/shared/types'

interface KanbanColumnProps {
  column: KanbanColumnType
  onAddTask: (columnId: string) => void
  children: React.ReactNode
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onAddTask,
  children,
}: {
  column: any
  onAddTask: (columnId: string) => void
  children: React.ReactNode
}) => {
  const columnBg = useColorModeValue('gray.200', 'gray.700')
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
  })

  return (
    <Box
      ref={setNodeRef}
      id={`column-${column.id}`}
      bg={columnBg}
      p={4}
      borderRadius='md'
      display='flex'
      flexDirection='column'
      h='100%'
      minH='400px'
      border={isOver ? '2px dashed blue' : 'none'}
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

      {children}
    </Box>
  )
}
