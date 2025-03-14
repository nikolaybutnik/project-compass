import { create } from 'zustand'
import { KanbanTask, Project } from '@/shared/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProject,
  getProjects,
} from '@/features/projects/services/projectsService'
import { AUTH_QUERY_KEYS, useAuthStore } from './authStore'
import { updateActiveProjectId } from '@/features/users/services/usersService'
import { createProject } from '@/features/projects/services/projectsService'
import { addTask, deleteTask } from '@/features/projects/services/tasksService'
export const QUERY_KEYS = {
  PROJECTS: 'projects',
  PROJECT: 'project',
}

interface ProjectsState {
  activeProjectId: string | null
  projects: Project[]
  setActiveProjectId: (id: string | null) => void
  setProjects: (projects: Project[]) => void
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  activeProjectId: null,
  projects: [],
  setActiveProjectId: (id) => set({ activeProjectId: id }),
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

  return useMutation({
    mutationFn: ({
      userId,
      projectData,
    }: {
      userId: string
      projectData: Partial<Project>
    }) => createProject(userId, projectData),
    onSuccess: (newProject) => {
      queryClient?.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECTS, newProject?.userId],
      })
    },
  })
}

// Update active project id
export const useSetActiveProjectMutation = () => {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const setActiveProjectId = useProjectsStore(
    (state) => state.setActiveProjectId
  )

  return useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) {
        throw new Error('User not authenticated')
      }

      const updatedUser = await updateActiveProjectId(user?.id, projectId)
      return { projectId, updatedUser }
    },
    onSuccess: ({ projectId, updatedUser }) => {
      queryClient?.setQueryData(
        [AUTH_QUERY_KEYS.USER, updatedUser?.id],
        updatedUser
      )
      useAuthStore?.getState()?.setUser(updatedUser)
      setActiveProjectId(projectId)
    },
  })
}

// Add a new task to a project
export const useAddTaskMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      columnId,
      taskData,
    }: {
      projectId: string
      columnId: string
      taskData: Partial<KanbanTask>
    }) => addTask(projectId, columnId, taskData),
    onSuccess: (updatedProject) => {
      queryClient?.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECT, updatedProject?.id],
      })
    },
  })
}

// Delete a task from a project
export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      columnId,
      taskId,
    }: {
      projectId: string
      columnId: string
      taskId: string
    }) => deleteTask(projectId, columnId, taskId),
    onSuccess: (updatedProject) => {
      queryClient?.invalidateQueries({
        queryKey: [QUERY_KEYS.PROJECT, updatedProject?.id],
      })
    },
  })
}
