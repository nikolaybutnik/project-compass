import { KanbanColumn, KanbanTask, Project, TaskPriority } from '@/shared/types'

export enum AIActionType {
  // Task actions
  CREATE_TASK = 'create_task',
  UPDATE_TASK = 'update_task',
  DELETE_TASK = 'delete_task',
  // Column actions
  CREATE_COLUMN = 'create_column',
  UPDATE_COLUMN = 'update_column',
  DELETE_COLUMN = 'delete_column',
  // Project actions
  CREATE_PROJECT = 'create_project',
  UPDATE_PROJECT_TITLE = 'update_project_title',
  UPDATE_PROJECT_DESCRIPTION = 'update_project_description',
  UPDATE_PROJECT_STATUS = 'update_project_status',
  // Search/filter actions
  SEARCH_TASKS = 'search_tasks',
  FILTER_TASKS = 'filter_tasks',
  // Analysis actions
  ANALYZE_PROJECT_STATUS = 'analyze_project_status',
  GENERATE_SUMMARY = 'generate_summary',
  // No action
  NONE = 'none',
  // Multiple actions
  MULTIPLE = 'multiple',
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

export interface ActionResult {
  success: boolean
  error?: string
}

export interface AIAction {
  type: AIActionType
  projectId?: string
  payload?:
    | {
        // For single actions
        actions: Array<{
          type: AIActionType
          result: ActionResult
          args: TaskPayload | ColumnPayload | ProjectPayload | SearchPayload
        }>
        // Also include the direct args for backwards compatibility
        [key: string]: any
      }
    | {
        // For multiple/no actions
        actions: Array<{
          type: AIActionType
          result: ActionResult
          args: TaskPayload | ColumnPayload | ProjectPayload | SearchPayload
        }>
      }
}

export interface AIResponse {
  message: string // Human-readable message to display
  action: AIAction // Structured action data for the app
}

export interface Message {
  role: MessageRole
  content: string
  timestamp?: number
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
