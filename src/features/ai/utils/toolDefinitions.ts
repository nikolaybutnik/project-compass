import { AIActionType } from '../types'

export const projectTools = {
  [AIActionType.UPDATE_PROJECT_TITLE]: {
    description: 'Update the title of the current project',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'New title for the project',
        },
      },
      required: ['title'],
    },
  },
}

export const taskTools = {
  [AIActionType.CREATE_TASK]: {
    description: 'Create a new task in the project',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the task',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the task',
        },
        columnId: {
          type: 'string',
          description: 'ID of the column where the task should be placed',
        },
        priority: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          description: 'Priority level of the task',
        },
      },
      required: ['title', 'columnId'],
    },
  },
  [AIActionType.UPDATE_TASK]: {
    description: 'Update an existing task',
    parameters: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'ID of the task to update',
        },
        title: {
          type: 'string',
          description: 'New title of the task',
        },
        description: {
          type: 'string',
          description: 'New description of the task',
        },
        columnId: {
          type: 'string',
          description: 'ID of the column to move the task to',
        },
        priority: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          description: 'New priority level of the task',
        },
      },
      required: ['taskId'],
    },
  },
  [AIActionType.DELETE_TASK]: {
    description: 'Delete a task',
    parameters: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'ID of the task to delete',
        },
      },
      required: ['taskId'],
    },
  },
}

export const getToolDefinitions = () => {
  return [
    ...Object.entries(projectTools).map(([name, definition]) => ({
      type: 'function' as const,
      function: {
        name,
        description: definition.description,
        parameters: definition.parameters,
      },
      ...Object.entries(taskTools).map(([name, definition]) => ({
        type: 'function' as const,
        function: {
          name,
          description: definition.description,
          parameters: definition.parameters,
        },
      })),
    })),
  ]
}

export const toolToActionMap: Record<string, AIActionType> = {
  update_project_title: AIActionType.UPDATE_PROJECT_TITLE,
  create_task: AIActionType.CREATE_TASK,
  update_task: AIActionType.UPDATE_TASK,
  delete_task: AIActionType.DELETE_TASK,
  // TODO: Add more tools beyond task management
}
