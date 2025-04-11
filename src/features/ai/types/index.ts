import { KanbanColumn, KanbanTask, Project, TaskPriority } from '@/shared/types'

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

export enum MessageRole {
  SYSTEM = 'system', // AI instructions and context
  USER = 'user', // Messages from the human user
  ASSISTANT = 'assistant', // Responses from the AI
  FUNCTION = 'function', // Results from function calls
  TOOL = 'tool', // Results from tool usage
  EVENT = 'event', // System events (project changes, etc.)
}

export enum ContextUpdateTrigger {
  PROJECT_TITLE = 'PROJECT_TITLE',
  PROJECT_DESCRIPTION = 'PROJECT_DESCRIPTION',
  KANBAN_TASKS_MOVED = 'KANBAN_TASKS_MOVED',
  KANBAN_TASKS_REORDERED = 'KANBAN_TASKS_REORDERED',
  KANBAN_TASK_UPDATED = 'KANBAN_TASK_UPDATED',
  KANBAN_TASK_ADDED = 'KANBAN_TASK_ADDED',
  KANBAN_TASK_DELETED = 'KANBAN_TASK_DELETED',
  PROJECT_CHANGED = 'PROJECT_CHANGED',
  NEW_PROJECT_CREATED = 'NEW_PROJECT_CREATED',
}

export interface TaskAddition {
  task: KanbanTask
  column: KanbanColumn
}

export interface TaskDeletion {
  task: KanbanTask
  column: KanbanColumn
}

export interface TaskReorder {
  task: KanbanTask
  column: KanbanColumn
  newIndex: number
}

export interface TaskMovement {
  task: KanbanTask
  fromColumn: KanbanColumn
  toColumn: KanbanColumn
}

export interface ContextUpdate {
  type: ContextUpdateTrigger
  details?: {
    task?: {
      movements?: TaskMovement[]
      additions?: TaskAddition[]
      deletions?: TaskDeletion[]
      reorders?: TaskReorder[]
    }
    project?: {
      title?: string
      description?: string
    }
    // future expansion:
    // column?: { ... }
    // other entities...
  }
}

export enum MentionType {
  TASK = 'task',
  COLUMN = 'column',
  PROJECT = 'project',
}

export interface ChatMention {
  type: MentionType
  id: string
  displayText: string
  searchText: string // For filtering
  entity: KanbanTask | KanbanColumn | Project
}

export interface TaskMention extends ChatMention {
  type: MentionType.TASK
  entity: KanbanTask
}
