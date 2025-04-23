import { FieldValue } from 'firebase/firestore'
import { User, Project, KanbanTask } from './index'

export type WriteTimestamp = FieldValue

export type KanbanTaskDto = Omit<KanbanTask, 'createdAt' | 'updatedAt'> & {
  createdAt: WriteTimestamp
  updatedAt: WriteTimestamp
}

export type ProjectDto = Omit<Project, 'createdAt' | 'updatedAt'> & {
  createdAt: WriteTimestamp
  updatedAt: WriteTimestamp
}

export type UserDto = {
  uid: string
  email: string
  displayName: string
  photoURL: string
}
