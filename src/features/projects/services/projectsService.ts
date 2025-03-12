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
import { Project } from '@/shared/types'
import { COLLECTIONS } from '@/shared/constants'

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
  userId: string | undefined,
  projectData: Partial<Project>
): Promise<Project> => {
  if (!userId) {
    throw new Error('User ID is required')
  }

  try {
    const projectRef = doc(collection(db, COLLECTIONS.PROJECTS))
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

export const getProjects = async (userId: string): Promise<Project[]> => {
  try {
    const projectsQuery = query(
      collection(db, COLLECTIONS.PROJECTS),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    )

    const querySnapshot = await getDocs(projectsQuery)
    return querySnapshot.docs.map((doc) => doc.data() as Project)
  } catch (error) {
    console.error('Error getting user projects:', error)
    throw error
  }
}
