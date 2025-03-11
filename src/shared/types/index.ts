// User interfaces
export interface User {
  uid: string
  email: string | null
  displayName: string | null
}

// Project interfaces
export interface Project {
  id: string
  userId: string
  title: string
  description: string
  status: 'planning' | 'in-progress' | 'completed' | 'abandoned'
  createdAt: number
  updatedAt: number
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
  createdAt?: number
  updatedAt?: number
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
  createdAt: number
  status: 'new' | 'viewed' | 'implemented' | 'dismissed' | 'saved'
  // Optional suggested tasks based on this insight
  suggestedTasks?: {
    title: string
    description: string
    priority?: 'low' | 'medium' | 'high'
  }[]
}

// More types will be added as we build features
