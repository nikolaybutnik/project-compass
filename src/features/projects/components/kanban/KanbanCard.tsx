import React, { useState } from 'react'
import { KanbanTask } from '@/shared/types'
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  useColorModeValue,
  Text,
} from '@chakra-ui/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface KanbanCardProps {
  task: KanbanTask
  onDelete: (columnId: string, taskId: string) => void
  isDragOverlay?: boolean
  disabled?: boolean
  isPreview?: boolean
  style?: React.CSSProperties
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  onDelete,
  isDragOverlay = false,
  disabled = false,
  isPreview = false,
  style = {},
}) => {
  const cardBg = useColorModeValue('white', 'gray.600')
  const badgeColorMap = {
    high: 'red',
    medium: 'orange',
    low: 'green',
    urgent: 'purple',
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task?.id,
  })

  const cardStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    cursor: isDragOverlay ? 'grabbing' : 'grab',
    ...(isPreview && {
      border: '2px dashed blue',
      background: cardBg,
    }),
    ...style,
  }

  const handleTaskDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onDelete(task?.columnId, task?.id)
  }

  return (
    <>
      <Box
        ref={setNodeRef}
        style={cardStyle}
        {...attributes}
        {...listeners}
        key={task?.id}
        id={`task-${task?.id}`}
        p={4}
        bg={cardBg}
        borderRadius='md'
        boxShadow='sm'
        _hover={{ boxShadow: 'md' }}
        position={isDragging ? 'relative' : undefined}
      >
        <HStack justify='space-between' mb={2}>
          <Heading size='sm'>{task?.title}</Heading>
          {task?.priority && (
            <Badge colorScheme={badgeColorMap[task?.priority]}>
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
            onMouseDown={handleTaskDelete}
            isDisabled={disabled}
          >
            Delete
          </Button>
        </HStack>
      </Box>
    </>
  )
}
