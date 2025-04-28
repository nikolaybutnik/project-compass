// User interfaces
export interface User {
  id: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  activeProjectId: string | null
  role: 'admin' | 'user'
  lastLogin: string
  createdAt: string
  updatedAt: string
  preferences: {
    theme: 'light' | 'dark'
    language: 'en' | 'es'
  }
}

// Project interfaces
export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Kanban {
  columns: KanbanColumn[]
  columnLimit?: number
  totalTaskLimit?: number
}

export interface Project {
  id: string
  userId: string
  title: string
  description: string
  kanban: Kanban
  status: ProjectStatus
  createdAt: string
  updatedAt: string
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
  dueDate?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

// AI Insight interfaces
export interface AiInsight {
  id: string
  title: string
  description: string
  type: 'improvement' | 'feature' | 'pivot' | 'risk' | 'optimization'
  createdAt: string
  status: 'new' | 'viewed' | 'implemented' | 'dismissed' | 'saved'
  // Optional suggested tasks based on this insight
  suggestedTasks?: {
    title: string
    description: string
    priority?: TaskPriority
  }[]
}

// More types will be added as we build features
