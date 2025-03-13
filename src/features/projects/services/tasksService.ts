import { db } from '@/shared/config/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from '@/shared/constants'
import { KanbanTask, Project } from '@/shared/types'
import { v4 as uuidv4 } from 'uuid'
import { KanbanTaskDto } from '@/shared/types/dto'

export const addTask = async (
  projectId: string,
  columnId: string,
  taskData: Partial<KanbanTask>
): Promise<Project> => {
  try {
    const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap?.exists()) {
      throw new Error('Project not found')
    }

    const project = projectSnap?.data() as Project
    const columnIndex = project?.kanban?.columns?.findIndex(
      (col) => col?.id === columnId
    )

    if (columnIndex === -1) {
      throw new Error(`Column with ID ${columnId} not found`)
    }

    const newTask: KanbanTaskDto = {
      id: uuidv4(),
      columnId,
      title: taskData?.title || '',
      description: taskData?.description || '',
      priority: taskData?.priority || 'low',
      tags: taskData?.tags || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await updateDoc(projectRef, {
      [`kanban.columns.${columnIndex}.tasks`]: [
        ...project.kanban.columns[columnIndex].tasks,
        newTask,
      ],
      updatedAt: serverTimestamp(),
    })

    const updatedProjectSnap = await getDoc(projectRef)
    return updatedProjectSnap?.data() as Project
  } catch (error) {
    console.error('Error adding task:', error)
    throw error
  }
}
