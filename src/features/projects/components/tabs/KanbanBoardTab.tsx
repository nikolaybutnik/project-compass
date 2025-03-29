import React from 'react'
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
  DragOverlay,
  rectIntersection,
  defaultDropAnimationSideEffects,
  MeasuringStrategy,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Project, KanbanColumn as KanbanColumnType } from '@/shared/types'
import { KanbanCard } from '@/features/projects/components/kanban/KanbanCard'
import { KanbanColumn } from '@/features/projects/components/kanban/KanbanColumn'
import { CreateTaskModal } from '@/features/projects/components/kanban/CreateTaskModal'
import { useKanbanBoard } from '@/features/projects/hooks/useKanbanBoard'

interface KanbanBoardTabProps {
  project: Project | undefined
  isLoading: boolean
  error: Error | null
}

// TODO: figure out how to handle card click which will eventually open an edit modal

export const KanbanBoardTab: React.FC<KanbanBoardTabProps> = ({
  project,
  isLoading,
  error,
}) => {
  const {
    // States
    columns,
    isAddTaskModalOpen,
    dragState,
    draggedTaskForOverlay,

    // DND handlers
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,

    // Task operations
    handleAddTask,
    handleNewTaskSubmit,
    handleDeleteTask,

    // Modal handlers
    closeAddTaskModal,
  } = useKanbanBoard(project)

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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} h='100%'>
        {columns?.map((col: KanbanColumnType) => (
          <KanbanColumn
            key={`column-${col?.id || Math.random()}`}
            column={col}
            onAddTask={() => handleAddTask(col?.id)}
          >
            <SortableContext
              items={col?.tasks?.map((t) => t?.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <VStack spacing={4} align='stretch' flex='1' overflow='auto'>
                {col?.tasks?.map((task) => {
                  const isBeingDragged = dragState.activeTask?.id === task.id
                  const isInActiveColumn =
                    dragState.activeTask?.columnId === col.id
                  const isDraggingWithinColumn =
                    isBeingDragged && isInActiveColumn

                  const previewId = `preview-${dragState.activeTask?.id}-in-`
                  const hasCrossColumnPreview =
                    dragState.dragPreviewItemIds?.some((id) =>
                      id?.includes(previewId)
                    )
                  const isCrossColumnSource =
                    isDraggingWithinColumn &&
                    dragState.activeTask &&
                    hasCrossColumnPreview

                  const isPreview =
                    isDraggingWithinColumn ||
                    dragState.dragPreviewItemIds?.includes(
                      `${task.id}-in-${col.id}`
                    )

                  const taskStyle = isCrossColumnSource
                    ? { border: '2px dashed orange' }
                    : undefined

                  return (
                    <KanbanCard
                      key={`${isPreview ? 'preview-' : ''}${task.id}-in-${col.id}`}
                      task={{ ...task, columnId: col.id }}
                      onDelete={handleDeleteTask}
                      disabled={isPreview}
                      isPreview={isPreview}
                      style={taskStyle}
                    />
                  )
                })}
              </VStack>
            </SortableContext>
          </KanbanColumn>
        ))}
      </SimpleGrid>

      <CreateTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={closeAddTaskModal}
        onSubmit={handleNewTaskSubmit}
      />

      <DragOverlay
        zIndex={999}
        dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.2, 0, 0.2, 1)',
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}
        style={{
          touchAction: 'none',
        }}
      >
        {draggedTaskForOverlay.current ? (
          <KanbanCard
            task={draggedTaskForOverlay.current}
            onDelete={handleDeleteTask}
            disabled={true}
            isDragOverlay={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
