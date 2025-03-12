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
export interface Project {
  id: string
  userId: string
  title: string
  description: string
  status: 'planning' | 'in-progress' | 'completed' | 'abandoned'
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Kanban interfaces
export interface KanbanTask {
  id: string
  title: string
  description: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: number
  assignee?: string
  tags?: string[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface KanbanColumn {
  id: string
  title: string
  tasks: KanbanTask[]
  limit?: number // Optional: for limiting number of tasks in a column
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
    priority?: 'low' | 'medium' | 'high'
  }[]
}

// More types will be added as we build features
