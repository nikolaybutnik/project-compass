import React, { useCallback, useMemo } from 'react'
import { memo } from 'react'
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

export const KanbanCard = memo(
  ({
    task,
    onDelete,
    isDragOverlay = false,
    disabled = false,
    isPreview = false,
    isDraggingToAnotherColumn = false,
  }: KanbanCardProps) => {
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

    const cssClasses = useMemo(
      () =>
        [
          isDraggingToAnotherColumn ? 'cross-column-source' : '',
          isPreview ? 'preview-card' : '',
          isDragging ? 'is-dragging' : '',
        ]
          .filter(Boolean)
          .join(' '),
      [isDraggingToAnotherColumn, isPreview, isDragging]
    )

    const cardTransition = isDragging
      ? transition
      : `${transition}, border-color 300ms, box-shadow 300ms`

    const cardStyle = useMemo(
      () => ({
        transform: CSS.Transform.toString(transform),
        transition: cardTransition,
        zIndex: isDragging ? 999 : 'auto',
        cursor: isDragOverlay ? 'grabbing' : 'pointer',
        willChange: isDragging ? 'transform' : 'auto',
      }),
      [transform, cardTransition, isDragging, isDragOverlay]
    )

    const handleTaskDelete = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        onDelete(task.columnId, task.id)
      },
      [onDelete, task.columnId, task.id]
    )

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
          },
          '&.is-dragging': {
            boxShadow: 'lg',
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
  },
  (prev, next) => {
    // 1. Check if task ID changed (shouldn't happen for same card)
    if (prev.task.id !== next.task.id) return false

    // 2. Check preview state changes
    if (prev.isPreview !== next.isPreview) return false

    // 3. Check if card is being dragged to another column
    if (prev.isDraggingToAnotherColumn !== next.isDraggingToAnotherColumn)
      return false

    // 4. Check if disabled state changed
    if (prev.disabled !== next.disabled) return false

    // 5. Check if drag overlay state changed
    if (prev.isDragOverlay !== next.isDragOverlay) return false

    // 6. For all other cases, prevent re-renders
    return true
  }
)
