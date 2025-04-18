import { Timestamp } from 'firebase/firestore'

// User interfaces
export interface User {
  id: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  activeProjectId: string | null
  role: 'admin' | 'user'
  lastLogin: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
  preferences: {
    theme: 'light' | 'dark'
    language: 'en' | 'es'
  }
}

// Project interfaces
export type ProjectStatus =
  | 'planning'
  | 'in-progress'
  | 'completed'
  | 'archived'

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Project {
  id: string
  userId: string
  title: string
  description: string
  kanban: {
    columns: KanbanColumn[]
    columnLimit?: number
    totalTaskLimit?: number
  }
  status: ProjectStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AIProjectInstructions {
  kanban?: Project['kanban']
  suggestions?: {
    title?: string
    status?: ProjectStatus
    description?: string
    timeline?: string
  }
}

// Kanban interfaces
export interface KanbanColumn {
  id: string
  title: string
  tasks: KanbanTask[]
  taskLimit?: number
}

export interface KanbanTask {
  id: string
  columnId: string
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: Timestamp
  tags?: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

// AI Insight interfaces
export interface AiInsight {
  id: string
  title: string
  description: string
  type: 'improvement' | 'feature' | 'pivot' | 'risk' | 'optimization'
  createdAt: Timestamp
  status: 'new' | 'viewed' | 'implemented' | 'dismissed' | 'saved'
  // Optional suggested tasks based on this insight
  suggestedTasks?: {
    title: string
    description: string
    priority?: TaskPriority
  }[]
}

// More types will be added as we build features
