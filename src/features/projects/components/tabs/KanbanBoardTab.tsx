import React, { memo, useMemo } from 'react'
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
  defaultDropAnimationSideEffects,
  MeasuringStrategy,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  Project,
  KanbanColumn as KanbanColumnType,
  KanbanTask,
} from '@/shared/types'
import { KanbanCard } from '@/features/projects/components/kanban/KanbanCard'
import { KanbanColumn } from '@/features/projects/components/kanban/KanbanColumn'
import { useKanbanBoard } from '@/features/projects/hooks/useKanbanBoard'
import { TaskDrawer } from '@/features/projects/components/kanban/TaskDrawer'
import { chatAwareCollision } from '@/features/projects/utils/chatAwareCollision'

interface KanbanBoardTabProps {
  project: Project | undefined
  isLoading: boolean
  error: Error | null
}

interface MemoizedColumnProps {
  column: KanbanColumnType
  isDragging: boolean
  onAddTask: (columnId: string) => void
  children: React.ReactNode
  hasPreview: boolean
  hasSourceTask: boolean
}

const MemoizedColumn = memo<MemoizedColumnProps>(
  ({ column, isDragging, onAddTask, children }) => {
    return (
      <KanbanColumn
        column={column}
        isDragging={isDragging}
        onAddTask={onAddTask}
        children={children}
      />
    )
  },
  (prev, next) => {
    // 1. Check preview state changes - most important for drag operation
    if (prev.hasPreview !== next.hasPreview) return false

    // 2. Check if column is the source of a dragged task
    if (prev.hasSourceTask) return false

    // 3. Check if dragging state changed
    if (prev.isDragging !== next.isDragging) return false

    // 4. Check for column ID changes (shouldn't happen for same column)
    if (prev.column.id !== next.column.id) return false

    // 5. Check if tasks count changed
    if (prev.column.tasks.length !== next.column.tasks.length) return false

    // 6. For all other cases, prevent re-renders
    return true
  }
)

interface MemoizedTaskListProps {
  tasks: KanbanTask[]
  columnId: string
  onDelete: (columnId: string, taskId: string) => void
}

const MemoizedTaskList = memo(
  ({ tasks, columnId, onDelete }: MemoizedTaskListProps) => {
    return tasks.map((task) => (
      <KanbanCard
        key={task.id}
        task={{ ...task, columnId }}
        onDelete={onDelete}
        disabled={false}
        isPreview={false}
        isDraggingToAnotherColumn={false}
      />
    ))
  },
  (prev, next) => {
    return prev.tasks === next.tasks && prev.columnId === next.columnId
  }
)

export const KanbanBoardTab: React.FC<KanbanBoardTabProps> = memo(
  ({ project, isLoading, error }) => {
    const {
      // States
      columns,
      isTaskDrawerOpen,
      activeColumnId,
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

      // Drawer handlers
      closeTaskDrawer,
    } = useKanbanBoard(project)

    const columnTaskItems = useMemo(() => {
      return columns.map((col) => ({
        id: col.id,
        taskIds: col.tasks.map((t) => t.id),
      }))
    }, [columns])

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
          collisionDetection={chatAwareCollision}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.WhileDragging,
            },
          }}
        >
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} h='100%'>
            {columns?.map((col: KanbanColumnType, index: number) => {
              const hasPreview = dragState.preview?.targetColumnId === col.id
              const hasSourceTask = dragState.activeTask?.columnId === col.id
              const shouldRerender =
                hasPreview || hasSourceTask || dragState.isDragInProgress

              return (
                <MemoizedColumn
                  key={`column-${col?.id || Math.random()}`}
                  column={col}
                  isDragging={dragState.isDragInProgress}
                  hasPreview={hasPreview}
                  hasSourceTask={hasSourceTask}
                  onAddTask={handleAddTask}
                >
                  <SortableContext
                    items={columnTaskItems[index]?.taskIds || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {shouldRerender ? (
                      col.tasks?.map((task) => {
                        const taskDragInfo = getDragStateInfo(
                          task,
                          col.id,
                          dragState
                        )
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
                      })
                    ) : (
                      <MemoizedTaskList
                        tasks={col.tasks}
                        columnId={col.id}
                        onDelete={handleDeleteTask}
                      />
                    )}
                  </SortableContext>
                </MemoizedColumn>
              )
            })}
          </SimpleGrid>

          <TaskDrawer
            isOpen={isTaskDrawerOpen}
            onClose={closeTaskDrawer}
            onSubmit={handleNewTaskSubmit}
            initialColumnId={activeColumnId || ''}
            columns={columns}
          />

          <DragOverlay
            zIndex={9999}
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
)
