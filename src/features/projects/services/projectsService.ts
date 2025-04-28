import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@/shared/config/firebase'
import { Project, ProjectStatus } from '@/shared/types'
import { COLLECTIONS } from '@/shared/constants'
import { ProjectDto } from '@/shared/types/dto'
import apiClient from '@/shared/api/apiClient'

export const createProject = async (
  userId: string | undefined,
  projectData: Partial<Project>
): Promise<Project> => {
  if (!userId) throw new Error('User ID is required')
  if (!projectData.title) throw new Error('Project title is required')

  try {
    const newProjectData: ProjectDto = {
      userId,
      title: projectData.title,
      description: projectData.description || '',
      status: projectData.status || ProjectStatus.PLANNING,
    }

    const response = await apiClient.post(
      '/api/firebase/projects',
      newProjectData
    )

    return response.data as Project
  } catch (error) {
    console.error('Error creating project:', error)
    throw error
  }
}

export const getProjects = async (userId: string): Promise<Project[]> => {
  try {
    if (!userId) throw new Error('User ID is required')

    const response = await apiClient.get(`/api/firebase/projects/${userId}`)

    return response.data as Project[]
  } catch (error) {
    console.error('Error getting user projects:', error)
    throw error
  }
}

export const getProject = async (projectId: string): Promise<Project> => {
  try {
    if (!projectId) {
      throw new Error('Project ID is required')
    }

    const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId)
    const docSnap = await getDoc(projectRef)

    if (!docSnap?.exists()) {
      throw new Error(`Project with ID ${projectId} not found`)
    }

    return docSnap?.data() as Project
  } catch (error) {
    console.error('Error getting project:', error)
    throw error
  }
}

export const updateTitle = async (projectId: string, newTitle: string) => {
  try {
    const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap?.exists()) {
      throw new Error('Project not found')
    }

    await updateDoc(projectRef, {
      title: newTitle,
      updatedAt: serverTimestamp(),
    })

    const updatedProjectSnap = await getDoc(projectRef)
    return updatedProjectSnap?.data() as Project
  } catch (error) {
    console.error('Error updating title:', error)
    throw error
  }
}

export const updateDescription = async (
  projectId: string,
  newDescription: string
) => {
  try {
    const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap?.exists()) {
      throw new Error('Project not found')
    }

    await updateDoc(projectRef, {
      description: newDescription,
      updatedAt: serverTimestamp(),
    })

    const updatedProjectSnap = await getDoc(projectRef)
    return updatedProjectSnap?.data() as Project
  } catch (error) {
    console.error('Error updating description:', error)
    throw error
  }
}
