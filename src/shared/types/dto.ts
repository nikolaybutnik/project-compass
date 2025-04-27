import { FieldValue } from 'firebase/firestore'
import { KanbanTask, ProjectStatus, Kanban } from './index'

export type WriteTimestamp = FieldValue

export type KanbanTaskDto = Omit<KanbanTask, 'createdAt' | 'updatedAt'> & {
  createdAt: WriteTimestamp
  updatedAt: WriteTimestamp
}

export type ProjectDto = {
  userId: string
  title: string
  description: string
  status: ProjectStatus
  kanban?: Kanban
}

export type UserDto = {
  uid: string
  email: string
  displayName: string
  photoURL: string
}
