import { create } from 'zustand'
import { Project, KanbanTask } from '@/shared/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProject,
  getProjects,
} from '@/features/projects/services/projectsService'

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
  return useQuery({
    queryKey: [QUERY_KEYS.PROJECTS, userId],
    queryFn: () => getProjects(userId),
    enabled: !!userId,
  })
}

// Get a single project
export const useProjectQuery = (projectId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PROJECT, projectId],
    queryFn: () => getProject(projectId),
    enabled: !!projectId,
  })
}
