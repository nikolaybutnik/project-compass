import React from 'react'
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
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
    getDragStateInfo,

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
    <Box h='calc(100vh - 270px)' overflow='hidden'>
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
              isDragging={!!dragState.activeTask}
              onAddTask={() => handleAddTask(col?.id)}
            >
              <SortableContext
                items={col?.tasks?.map((t) => t?.id) || []}
                strategy={verticalListSortingStrategy}
              >
                {col.tasks?.map((task) => {
                  const taskDragInfo = getDragStateInfo(task, col.id, dragState)

                  return (
                    <KanbanCard
                      key={taskDragInfo.key}
                      task={{ ...task, columnId: col.id }}
                      onDelete={handleDeleteTask}
                      disabled={taskDragInfo.isPreview}
                      isPreview={taskDragInfo.isPreview}
                      isDraggingToAnotherColumn={
                        taskDragInfo.isCrossColumnSource
                      }
                    />
                  )
                })}
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
    </Box>
  )
}
