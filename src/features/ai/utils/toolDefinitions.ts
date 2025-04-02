export const getToolDefinitions = (projectId: string) => [
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Creates a new task in a column',
      parameters: {
        type: 'object',
        properties: {
          columnId: {
            type: 'string',
            description: 'ID of the column to add the task to',
          },
          title: {
            type: 'string',
            description: 'Title of the task',
          },
          description: {
            type: 'string',
            description: 'Detailed description of the task',
          },
          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low', 'urgent'],
            description: 'Priority level of the task',
          },
        },
        required: ['columnId', 'title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description: 'Updates an existing task',
      parameters: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'ID of the task to update',
          },
          title: {
            type: 'string',
            description: 'New title for the task',
          },
          description: {
            type: 'string',
            description: 'New description for the task',
          },
          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low', 'urgent'],
          },
        },
        required: ['taskId'],
      },
    },
  },
]
