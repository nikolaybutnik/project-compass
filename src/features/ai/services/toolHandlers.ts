import { AIActionType } from '../types'
import { updateProjectTitleMutation } from '@/shared/store/projectsStore'

export const handleToolCall = async (
  projectId: string,
  toolName: string,
  args: any
) => {
  switch (toolName) {
    case AIActionType.UPDATE_PROJECT_TITLE:
      const updateTitle = updateProjectTitleMutation()
      await updateTitle.mutateAsync({
        projectId,
        newTitle: args.title,
      })
      return `Project title updated to "${args.title}"`
    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}
