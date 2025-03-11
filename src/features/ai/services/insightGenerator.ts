import { AiInsight, Project, KanbanTask } from '@/shared/types'
import { v4 as uuidv4 } from 'uuid'

// This simulates AI-generated insights based on project data
// Will be replaced with OpenAI integration later
export const generateInsights = async (
  project: Project,
  tasks: KanbanTask[]
): Promise<AiInsight[]> => {
  // For demo purposes, generate some sample insights
  // In production, this would call the OpenAI API

  const insightTypes: AiInsight['type'][] = [
    'improvement',
    'feature',
    'pivot',
    'risk',
    'optimization',
  ]

  // Get random type
  const getRandomType = () => {
    return insightTypes[Math.floor(Math.random() * insightTypes.length)]
  }

  // Create a simulated delay to mimic API call
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Generate 3-5 insights
  const count = Math.floor(Math.random() * 3) + 3
  const insights: AiInsight[] = []

  for (let i = 0; i < count; i++) {
    const type = getRandomType()
    const insight: AiInsight = {
      id: uuidv4(),
      title: getInsightTitle(type, project),
      description: getInsightDescription(type, project),
      type,
      createdAt: Date.now() - Math.floor(Math.random() * 86400000), // Random time in the last 24 hours
      status: 'new',
      suggestedTasks: type !== 'risk' ? [getSuggestedTask(type)] : undefined,
    }

    insights.push(insight)
  }

  return insights
}

// Helper functions to generate plausible content
function getInsightTitle(type: AiInsight['type'], project: Project): string {
  const titles = {
    improvement: [
      'Enhance user onboarding flow',
      'Simplify task creation process',
      'Improve kanban board visibility',
    ],
    feature: [
      'Add time tracking capabilities',
      'Implement team collaboration features',
      'Create project templates system',
    ],
    pivot: [
      'Consider expanding to mobile platforms',
      'Explore enterprise market opportunities',
      'Shift focus to integration capabilities',
    ],
    risk: [
      'Potential scalability issues identified',
      'Consider security enhancements',
      'Address potential user confusion points',
    ],
    optimization: [
      'Optimize data loading performance',
      'Streamline task management workflow',
      'Enhance project overview clarity',
    ],
  }

  const options = titles[type]
  return options[Math.floor(Math.random() * options.length)]
}

function getInsightDescription(
  type: AiInsight['type'],
  project: Project
): string {
  const descriptions = {
    improvement: `Based on analysis of your project, improving the user interface for ${project.title} could significantly enhance user experience. Consider using more intuitive icons and providing tooltip explanations for complex features. The current workflow requires several clicks to complete common actions, which could be streamlined.`,

    feature: `Adding a collaborative annotation feature would enhance ${project.title}'s value proposition. This would allow team members to leave comments directly on tasks, reducing the need for separate communication channels. This feature aligns well with your project's focus on productivity and could be implemented within your current architecture.`,

    pivot: `Your current direction with ${project.title} shows promise, but market analysis suggests a potential opportunity in focusing on remote team collaboration. The shift to remote work has created demand for tools that specifically address asynchronous workflows. Consider adapting your roadmap to emphasize features that support this use case.`,

    risk: `There's a potential risk in the current architecture of ${project.title} regarding data persistence. If a user's session unexpectedly ends, they might lose unsaved changes. Consider implementing auto-save functionality and local storage backup to mitigate this risk before it affects user satisfaction.`,

    optimization: `Analysis of ${project.title}'s workflow reveals opportunities to optimize the task creation process. Currently, users need to navigate through multiple screens. By implementing a quick-add feature accessible from any page, you could reduce friction and increase task creation completion rates by an estimated 35%.`,
  }

  return descriptions[type]
}

function getSuggestedTask(type: AiInsight['type']): {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
} {
  // Add explicit type for tasks
  const tasks: Record<
    AiInsight['type'],
    {
      title: string
      description: string
      priority: 'low' | 'medium' | 'high'
    }
  > = {
    improvement: {
      title: 'Implement improvement',
      description: 'Work on this suggested improvement to enhance the project',
      priority: 'medium',
    },
    feature: {
      title: 'Develop new feature',
      description: 'Create this new feature to expand functionality',
      priority: 'medium',
    },
    pivot: {
      title: 'Consider strategic pivot',
      description: 'Evaluate this potential direction change',
      priority: 'high',
    },
    risk: {
      title: 'Address project risk',
      description: 'Mitigate this identified risk to project success',
      priority: 'high',
    },
    optimization: {
      title: 'Optimize project',
      description: 'Implement this optimization to improve performance',
      priority: 'medium',
    },
  }

  return (
    tasks[type] || {
      title: 'Review AI suggestion',
      description:
        'Assess the feasibility and potential impact of this insight',
      priority: 'medium',
    }
  )
}
