import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/shared/config/firebase'
import { AIProjectInstructions, Project, ProjectStatus } from '@/shared/types'
import { COLLECTIONS } from '@/shared/constants'
import { v4 as uuidv4 } from 'uuid'
import { ProjectDto } from '@/shared/types/dto'

const createNewProjectData = (
  id: string,
  userId: string,
  projectData: Partial<Project>,
  aiInstructions?: AIProjectInstructions
): ProjectDto => {
  const defaultKanban: Project['kanban'] = {
    columns: [
      {
        id: uuidv4(),
        title: 'To Do',
        tasks: [],
      },
      {
        id: uuidv4(),
        title: 'In Progress',
        tasks: [],
      },
      {
        id: uuidv4(),
        title: 'Completed',
        tasks: [],
      },
    ],
  }

  let title: string = projectData?.title || ''
  let kanban: Project['kanban'] = defaultKanban
  let status: ProjectStatus = 'planning'
  let description: string = projectData?.description || ''

  if (aiInstructions?.suggestions?.title)
    title = aiInstructions.suggestions.title
  if (aiInstructions?.kanban) kanban = aiInstructions.kanban
  if (aiInstructions?.suggestions?.status)
    status = aiInstructions.suggestions.status
  if (aiInstructions?.suggestions?.description)
    description = aiInstructions.suggestions.description

  return {
    id,
    userId,
    title,
    description,
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    kanban,
  }
}

export const createProject = async (
  userId: string | undefined,
  projectData: Partial<Project>
): Promise<Project> => {
  if (!userId) {
    throw new Error('User ID is required')
  }

  try {
    const projectRef = doc(collection(db, COLLECTIONS.PROJECTS))
    const newProjectDto = createNewProjectData(
      projectRef?.id,
      userId,
      projectData
    )

    await setDoc(projectRef, newProjectDto)

    const docSnap = await getDoc(projectRef)
    if (!docSnap?.exists()) {
      throw new Error('Failed to create project')
    }

    return docSnap.data() as Project
  } catch (error) {
    console.error('Error creating project:', error)
    throw error
  }
}

export const getProjects = async (userId: string): Promise<Project[]> => {
  try {
    const projectsQuery = query(
      collection(db, COLLECTIONS.PROJECTS),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    )

    const querySnapshot = await getDocs(projectsQuery)
    return querySnapshot?.docs?.map((doc) => doc?.data() as Project)
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
    console.log('projectId', projectId)

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
