import { db } from '@/shared/config/firebase'
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { COLLECTIONS } from '@/shared/constants'
import { KanbanTask, Project, TaskPriority } from '@/shared/types'
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
      priority: taskData?.priority || TaskPriority.LOW,
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

export const moveTask = async (
  projectId: string,
  sourceColumnId: string,
  targetColumnId: string,
  taskId: string
) => {
  try {
    const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap?.exists()) {
      throw new Error('Project not found')
    }

    const project = projectSnap?.data() as Project

    const sourceColumn = project?.kanban?.columns?.find(
      (col) => col?.id === sourceColumnId
    )

    if (!sourceColumn) {
      throw new Error(`Source column with ID ${sourceColumnId} not found`)
    }

    const taskToMove = sourceColumn?.tasks?.find((task) => task?.id === taskId)

    if (!taskToMove) {
      throw new Error(`Task with ID ${taskId} not found in source column`)
    }

    const updatedColumns = project?.kanban?.columns?.map((col) => {
      if (col?.id === sourceColumnId) {
        return {
          ...col,
          tasks: col?.tasks?.filter((task) => task?.id !== taskToMove?.id),
        }
      }

      if (col?.id === targetColumnId) {
        const now = Timestamp.now()

        return {
          ...col,
          tasks: [
            ...col?.tasks,
            {
              ...taskToMove,
              columnId: targetColumnId,
              updatedAt: now,
            },
          ],
        }
      }

      return col
    })

    await updateDoc(projectRef, {
      'kanban.columns': updatedColumns,
      updatedAt: serverTimestamp(),
    })

    const updatedProjectSnap = await getDoc(projectRef)
    return updatedProjectSnap?.data() as Project
  } catch (error) {
    console.error('Error moving task:', error)
    throw error
  }
}

export const reorderTasks = async (
  projectId: string,
  columnId: string,
  taskId: string,
  newIndex: number
): Promise<Project> => {
  try {
    const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap?.exists()) {
      throw new Error('Project not found')
    }

    const project = projectSnap?.data() as Project
    const columns = project?.kanban?.columns || []
    const columnIndex = columns?.findIndex((col) => col?.id === columnId)

    if (columnIndex === -1) {
      throw new Error(`Column with ID ${columnId} not found`)
    }

    const tasks = [...(columns[columnIndex]?.tasks || [])]
    const taskIndex = tasks?.findIndex((task) => task?.id === taskId)

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found in column`)
    }

    const [taskToMove] = tasks?.splice(taskIndex, 1)
    tasks?.splice(newIndex, 0, {
      ...taskToMove,
      updatedAt: Timestamp.now(),
    })

    const updatedColumns = columns?.map((col) => {
      if (col?.id === columnId) {
        return { ...col, tasks }
      } else return col
    })

    await updateDoc(projectRef, {
      'kanban.columns': updatedColumns,
      updatedAt: serverTimestamp(),
    })

    const updatedProjectSnap = await getDoc(projectRef)
    return updatedProjectSnap?.data() as Project
  } catch (error) {
    console.error('Error reordering task:', error)
    throw error
  }
}
