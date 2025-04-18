import { create } from 'zustand'
import { KanbanColumn, KanbanTask, Project } from '@/shared/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProject,
  getProjects,
  updateDescription,
  updateTitle,
} from '@/features/projects/services/projectsService'
import { createProject } from '@/features/projects/services/projectsService'
import {
  addTask,
  deleteTask,
  moveTask,
  reorderTasks,
} from '@/features/projects/services/tasksService'
import { Timestamp } from 'firebase/firestore'
import { useAI } from '@/features/ai/context/aiContext'
import { ContextUpdateTrigger } from '@/features/ai/types'
export const QUERY_KEYS = {
  PROJECTS: 'projects',
  PROJECT: 'project',
}

interface ProjectsState {
  projects: Project[]
  setProjects: (projects: Project[]) => void
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
}))

// Get all projects
export const useProjectsQuery = (userId: string) => {
  const setProjects = useProjectsStore((state) => state.setProjects)

  return useQuery({
    queryKey: [QUERY_KEYS.PROJECTS, userId],
    queryFn: () => getProjects(userId),
    enabled: !!userId,
    select(data) {
      setProjects(data)
      return data
    },
  })
}

// Get a single project
export const useProjectQuery = (projectId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PROJECT, projectId],
    queryFn: () => getProject(projectId),
    enabled: !!projectId,
    select(data) {
      return data
    },
  })
}

// Create a new project
export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient()
  const { invalidateContext } = useAI()

  return useMutation({
    mutationFn: ({
      userId,
      projectData,
    }: {
      userId: string
      projectData: Partial<Project>
    }) => createProject(userId, projectData),
    onError: (err) => {
      console.error('Failed to create project:', err)
    },
    onSuccess: (newProject) => {
      queryClient?.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECTS, newProject?.userId],
      })
      invalidateContext({ type: ContextUpdateTrigger.NEW_PROJECT_CREATED })
    },
  })
}

// Add a new task to a project
export const useAddTaskMutation = () => {
  const queryClient = useQueryClient()
  const { invalidateContext } = useAI()

  return useMutation({
    mutationFn: async ({
      projectId,
      columnId,
      taskData,
    }: {
      projectId: string
      columnId: string
      taskData: Partial<KanbanTask>
    }) => {
      const updatedProject = await addTask(projectId, columnId, taskData)
      // Capture the newly added task in the response
      const column = updatedProject.kanban?.columns?.find(
        (col) => col.id === columnId
      )
      const tasks = column?.tasks || []
      const newTask = tasks[tasks.length - 1]

      return {
        project: updatedProject,
        newTask,
        column,
      }
    },
    onError: (err) => {
      console.error('Failed to create task:', err)
    },
    onSettled: (result, _err, variables) => {
      if (result?.project && result?.newTask && result?.column) {
        invalidateContext({
          type: ContextUpdateTrigger.KANBAN_TASK_ADDED,
          details: {
            task: {
              additions: [{ task: result.newTask, column: result.column }],
            },
          },
        })
      }
      queryClient?.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECT, variables?.projectId],
      })
    },
  })
}

// Delete a task from a project
export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient()
  const { invalidateContext } = useAI()

  return useMutation({
    mutationFn: ({
      projectId,
      columnId,
      taskId,
    }: {
      projectId: string
      columnId: string
      taskId: string
    }) => {
      // Capture the task before deleting it
      const project = queryClient.getQueryData([
        QUERY_KEYS.PROJECT,
        projectId,
      ]) as Project
      const column = project?.kanban?.columns?.find(
        (col) => col.id === columnId
      )
      const taskToDelete = column?.tasks?.find((t) => t.id === taskId)

      if (!taskToDelete) {
        throw new Error('Task not found')
      }

      return deleteTask(projectId, columnId, taskId).then((data) => ({
        data,
        deletedTask: taskToDelete,
      }))
    },
    onError: (err) => {
      console.error('Failed deleting task:', err)
    },
    onSettled: (result, _err, variables) => {
      if (result?.data) {
        const column = result.data.kanban?.columns?.find(
          (col) => col.id === variables.columnId
        )

        if (column && result.deletedTask) {
          invalidateContext({
            type: ContextUpdateTrigger.KANBAN_TASK_DELETED,
            details: {
              task: {
                deletions: [
                  {
                    task: result.deletedTask,
                    column,
                  },
                ],
              },
            },
          })
        }
      }

      queryClient?.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECT, variables?.projectId],
      })
    },
  })
}

// Move a task from one column to another
export const useMoveTaskMutation = () => {
  const queryClient = useQueryClient()
  const { invalidateContext } = useAI()

  return useMutation({
    mutationFn: async ({
      projectId,
      sourceColumnId,
      targetColumnId,
      taskId,
      targetIndex,
    }: {
      projectId: string
      sourceColumnId: string
      targetColumnId: string
      taskId: string
      targetIndex?: number
    }) =>
      moveTask(projectId, sourceColumnId, targetColumnId, taskId, targetIndex),
    onMutate: async ({
      projectId,
      sourceColumnId,
      targetColumnId,
      taskId,
      targetIndex,
    }) => {
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.PROJECT, projectId],
      })

      const previousProjectSnapshot = queryClient.getQueryData([
        QUERY_KEYS.PROJECT,
        projectId,
      ])

      // Optimistically update the columns in the cache
      queryClient.setQueryData(
        [QUERY_KEYS.PROJECT, projectId],
        (oldProject: Project) => {
          let taskToMove: KanbanTask | undefined

          for (const col of oldProject?.kanban?.columns || []) {
            if (col?.id === sourceColumnId) {
              taskToMove = col?.tasks?.find((task) => task?.id === taskId)
              break
            }
          }

          if (!taskToMove) return oldProject

          const taskCopy: KanbanTask = {
            ...taskToMove,
            columnId: targetColumnId,
            updatedAt: Timestamp.now(),
          }

          const updatedColumns = oldProject?.kanban?.columns?.map((col) => {
            if (col?.id === sourceColumnId) {
              return {
                ...col,
                tasks: col?.tasks?.filter((task) => task?.id !== taskId) || [],
              }
            }

            if (col?.id === targetColumnId) {
              if (targetIndex !== undefined) {
                const newTasks = [...(col?.tasks || [])]
                newTasks?.splice(targetIndex, 0, taskCopy)
                return {
                  ...col,
                  tasks: newTasks,
                }
              } else {
                return {
                  ...col,
                  tasks: [...(col?.tasks || []), taskCopy],
                }
              }
            }

            return col
          })

          return {
            ...oldProject,
            kanban: {
              ...oldProject?.kanban,
              columns: updatedColumns,
            },
          }
        }
      )

      // This object is passed to onError as 'context' in case the mutation fails
      return { previousProjectSnapshot }
    },
    onError: (err, variables, context) => {
      // If mutation fails, roll back to previous state
      queryClient.setQueryData(
        [QUERY_KEYS.PROJECT, variables.projectId],
        context?.previousProjectSnapshot
      )
      console.error('Error moving task:', err)
    },
    onSettled: (data, _err, variables) => {
      if (data) {
        let fromColumn: KanbanColumn | undefined
        let toColumn: KanbanColumn | undefined
        let task: KanbanTask | undefined

        data.kanban?.columns?.forEach((col) => {
          if (col.id === variables.sourceColumnId) {
            fromColumn = col
          }
          if (col.id === variables.targetColumnId) {
            toColumn = col
            task = col.tasks?.find((task) => task.id === variables.taskId)
          }
        })

        if (task && fromColumn && toColumn) {
          invalidateContext({
            type: ContextUpdateTrigger.KANBAN_TASKS_MOVED,
            details: {
              task: {
                movements: [
                  {
                    task,
                    fromColumn,
                    toColumn,
                  },
                ],
              },
            },
          })
        }
      }

      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECT, variables?.projectId],
      })
    },
  })
}

// Reorder tasks within a column
export const useReorderTasksMutation = () => {
  const queryClient = useQueryClient()
  const { invalidateContext } = useAI()

  return useMutation({
    mutationFn: async ({
      projectId,
      columnId,
      taskId,
      newIndex,
    }: {
      projectId: string
      columnId: string
      taskId: string
      newIndex: number
    }) => reorderTasks(projectId, columnId, taskId, newIndex),
    onMutate: async ({ projectId, columnId, taskId, newIndex }) => {
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.PROJECT, projectId],
      })

      const previousProjectSnapshot = queryClient.getQueryData([
        QUERY_KEYS.PROJECT,
        projectId,
      ])

      queryClient.setQueryData(
        [QUERY_KEYS.PROJECT, projectId],
        (oldProject: Project) => {
          const updatedColumns = oldProject?.kanban?.columns?.map((col) => {
            if (col?.id === columnId) {
              const tasks = [...(col?.tasks || [])]
              const taskIndex = tasks?.findIndex((task) => task?.id === taskId)

              if (taskIndex !== -1) {
                const [taskToMove] = tasks?.splice(taskIndex, 1)
                tasks?.splice(newIndex, 0, {
                  ...taskToMove,
                  updatedAt: Timestamp.now(),
                })

                return { ...col, tasks }
              }
            }

            return col
          })

          return {
            ...oldProject,
            kanban: {
              ...oldProject?.kanban,
              columns: updatedColumns,
            },
          }
        }
      )

      return { previousProjectSnapshot }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        [QUERY_KEYS.PROJECT, variables?.projectId],
        context?.previousProjectSnapshot
      )
      console.error('Error reordering tasks:', err)
    },
    onSettled: (data, _err, variables) => {
      if (data) {
        const column = data.kanban?.columns?.find(
          (col) => col.id === variables.columnId
        )
        const task = column?.tasks?.find((t) => t.id === variables.taskId)

        if (task && column) {
          invalidateContext({
            type: ContextUpdateTrigger.KANBAN_TASKS_REORDERED,
            details: {
              task: {
                reorders: [
                  {
                    task,
                    column,
                    newIndex: variables.newIndex,
                  },
                ],
              },
            },
          })
        }
      }
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECT, variables?.projectId],
      })
    },
  })
}

// Uodate project title
export const updateProjectTitleMutation = () => {
  const queryClient = useQueryClient()
  const { invalidateContext } = useAI()

  return useMutation({
    mutationFn: async ({
      projectId,
      newTitle,
    }: {
      projectId: string
      newTitle: string
    }) => updateTitle(projectId, newTitle),
    onMutate: async ({ projectId, newTitle }) => {
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.PROJECT, projectId],
      })

      const previousProjectSnapshot = queryClient.getQueryData([
        QUERY_KEYS.PROJECT,
        projectId,
      ])

      queryClient.setQueryData(
        [QUERY_KEYS.PROJECT, projectId],
        (old: Project) => ({
          ...old,
          title: newTitle,
        })
      )

      return { previousProjectSnapshot }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        [QUERY_KEYS.PROJECT, variables?.projectId],
        context?.previousProjectSnapshot
      )
      console.error('Error updating project title', err)
    },
    onSettled: (data, _err, variables) => {
      if (data) {
        invalidateContext({
          type: ContextUpdateTrigger.PROJECT_TITLE,
          details: {
            project: {
              title: data.title,
            },
          },
        })
      }
      queryClient?.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECT, variables?.projectId],
      })
      queryClient?.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECTS],
      })
    },
  })
}

// Update project description
export const updateProjectDescriptionMutation = () => {
  const queryClient = useQueryClient()
  const { invalidateContext } = useAI()

  return useMutation({
    mutationFn: async ({
      projectId,
      newDescription,
    }: {
      projectId: string
      newDescription: string
    }) => updateDescription(projectId, newDescription),
    onMutate: async ({ projectId, newDescription }) => {
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.PROJECT, projectId],
      })

      const previousProjectSnapshot = queryClient.getQueryData([
        QUERY_KEYS.PROJECT,
        projectId,
      ])

      queryClient.setQueryData(
        [QUERY_KEYS.PROJECT, projectId],
        (old: Project) => ({
          ...old,
          description: newDescription,
        })
      )

      return { previousProjectSnapshot }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        [QUERY_KEYS.PROJECT, variables?.projectId],
        context?.previousProjectSnapshot
      )
      console.error('Error updating project description', err)
    },
    onSettled: (data, _err, variables) => {
      if (data) {
        invalidateContext({
          type: ContextUpdateTrigger.PROJECT_DESCRIPTION,
          details: {
            project: {
              description: data.description,
            },
          },
        })
      }
      queryClient?.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECT, variables?.projectId],
      })
      queryClient?.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECTS],
      })
    },
  })
}
