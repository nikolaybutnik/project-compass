import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/shared/config/firebase'
import { Project } from '@/shared/types'

const PROJECTS_COLLECTION = 'projects'

const createProjectData = (
  id: string,
  userId: string,
  projectData: Partial<Project>
) => ({
  id,
  userId,
  title: projectData.title || 'Untitled Project',
  description: projectData.description || '',
  status: projectData.status || 'planning',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
})

export const createProject = async (
  userId: string,
  projectData: Partial<Project>
): Promise<Project> => {
  try {
    const projectRef = doc(collection(db, PROJECTS_COLLECTION))
    const newProject = createProjectData(projectRef.id, userId, projectData)

    await setDoc(projectRef, newProject)

    const docSnap = await getDoc(projectRef)
    if (!docSnap.exists()) {
      throw new Error('Failed to create project')
    }

    return docSnap.data() as Project
  } catch (error) {
    console.error('Error creating project:', error)
    throw error
  }
}
