import { db } from '@/shared/config/firebase'
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
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

    // This step is needed to bypass Firebase limitations on serverTimestamp being used inside arrays
    const now = Timestamp.now()
    const newTask: KanbanTaskDto = {
      id: uuidv4(),
      columnId,
      title: taskData?.title || '',
      description: taskData?.description || '',
      priority: taskData?.priority || 'low',
      tags: taskData?.tags || [],
      createdAt: now,
      updatedAt: now,
    }

    const updatedColumnArray = project?.kanban?.columns?.map((col) => {
      if (col?.id === columnId) {
        return { ...col, tasks: [...col?.tasks, newTask] }
      } else return col
    })

    await updateDoc(projectRef, {
      'kanban.columns': updatedColumnArray,
      updatedAt: serverTimestamp(),
    })

    const updatedProjectSnap = await getDoc(projectRef)
    return updatedProjectSnap?.data() as Project
  } catch (error) {
    console.error('Error adding task:', error)
    throw error
  }
}

export const deleteTask = async (
  projectId: string,
  columnId: string,
  taskId: string
) => {
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

    const updatedColumnArray = project?.kanban?.columns?.map((col) => {
      if (col?.id === columnId) {
        const filteredTasks = col?.tasks?.filter((task) => task?.id !== taskId)
        return { ...col, tasks: filteredTasks }
      } else return col
    })

    await updateDoc(projectRef, {
      'kanban.columns': updatedColumnArray,
      updatedAt: serverTimestamp(),
    })

    const updatedProjectSnap = await getDoc(projectRef)
    return updatedProjectSnap?.data() as Project
  } catch (error) {
    console.error('Error deleting task:', error)
    throw error
  }
}
