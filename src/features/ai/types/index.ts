import { TaskPriority } from '@/shared/types'

export enum AIActionType {
  // Task actions
  CREATE_TASK = 'CREATE_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  // Column actions
  CREATE_COLUMN = 'CREATE_COLUMN',
  UPDATE_COLUMN = 'UPDATE_COLUMN',
  DELETE_COLUMN = 'DELETE_COLUMN',
  // Project actions
  CREATE_PROJECT = 'CREATE_PROJECT',
  UPDATE_PROJECT = 'UPDATE_PROJECT',
  UPDATE_PROJECT_DESCRIPTION = 'UPDATE_PROJECT_DESCRIPTION',
  UPDATE_PROJECT_STATUS = 'UPDATE_PROJECT_STATUS',
  // Search/filter actions
  SEARCH_TASKS = 'SEARCH_TASKS',
  FILTER_TASKS = 'FILTER_TASKS',
  // Analysis actions
  ANALYZE_PROJECT_STATUS = 'ANALYZE_PROJECT_STATUS',
  GENERATE_SUMMARY = 'GENERATE_SUMMARY',
  // No action
  NONE = 'NONE',
}

export interface TaskPayload {
  taskId?: string
  columnId?: string
  title?: string
  description?: string
  priority?: TaskPriority
}

export interface ColumnPayload {
  columnId?: string
  title?: string
  position?: number
}

export interface ProjectPayload {
  name?: string
  description?: string
  status?: 'active' | 'on-hold' | 'completed'
}

export interface SearchPayload {
  query?: string
  filters?: {
    priority?: string[]
    status?: string[]
    dateRange?: {
      start?: string
      end?: string
    }
  }
}

export interface AnalysisPayload {
  summaryText?: string
  analysisType?: 'status' | 'progress' | 'bottlenecks' | 'timeline'
}

export interface AIAction {
  type: AIActionType
  projectId?: string
  payload?:
    | TaskPayload
    | ColumnPayload
    | ProjectPayload
    | SearchPayload
    | AnalysisPayload
}

export interface AIResponse {
  message: string // Human-readable message to display
  action: AIAction // Structured action data for the app
}
