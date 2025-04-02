import React from 'react'
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
  isDraggingToAnotherColumn?: boolean
}

export const KanbanCard: React.FC<KanbanCardProps> = React.memo(
  ({
    task,
    onDelete,
    isDragOverlay = false,
    disabled = false,
    isPreview = false,
    isDraggingToAnotherColumn = false,
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
      id: task.id,
    })

    const cssClasses = [
      isDraggingToAnotherColumn
        ? 'cross-column-source'
        : isPreview
          ? 'preview-card'
          : '',

      isPreview && !isDraggingToAnotherColumn && !isDragging
        ? 'preview-animation'
        : '',

      isDragging ? 'is-dragging' : '',
    ]
      .filter(Boolean)
      .join(' ')

    const cardStyle = {
      transform: CSS.Transform.toString(transform),
      transition: `${transition}, border-color 300ms, box-shadow 300ms`,
      zIndex: isDragging ? 999 : 'auto',
      cursor: isDragOverlay ? 'grabbing' : 'pointer',
    }

    const handleTaskDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onDelete(task.columnId, task.id)
    }

    return (
      <Box
        ref={setNodeRef}
        style={cardStyle}
        className={cssClasses}
        {...attributes}
        {...listeners}
        p={4}
        bg={cardBg}
        borderRadius='md'
        boxShadow='sm'
        _hover={{ boxShadow: 'md' }}
        sx={{
          '&.cross-column-source': {
            borderColor: 'orange.500',
            borderWidth: '2px',
            borderStyle: 'dashed',
          },
          '&.preview-card': {
            borderColor: 'blue.400',
            borderWidth: '2px',
            borderStyle: 'dashed',
            bg: `${cardBg} !important`,
            opacity: '0.5 !important',
          },
          '&.preview-animation': {
            animation: 'fadeIn 0.2s ease-in-out',
          },
          '&.is-dragging': {
            boxShadow: 'lg',
          },
          '@keyframes fadeIn': {
            '0%': { opacity: 0, transform: 'translateY(3px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <HStack justify='space-between' mb={2}>
          <Heading size='sm'>{task.title}</Heading>
          {task.priority && (
            <Badge colorScheme={badgeColorMap[task.priority]}>
              {task.priority}
            </Badge>
          )}
        </HStack>

        <Text fontSize='sm' color='gray.500'>
          {task.description}
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
    )
  }
)
