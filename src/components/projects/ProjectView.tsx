import React, { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
} from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import { KanbanBoard } from '../kanban/KanbanBoard'
import { ProjectOverview } from './ProjectOverview'
import { Project } from '../../types'

export const ProjectView = () => {
  const { projectId } = useParams()
  const toast = useToast()
  const [project, setProject] = useState<Project>({
    id: projectId || 'demo',
    title: 'Demo Project',
    description:
      'This is a sample project to demonstrate the features of Project Compass. The AI has analyzed your project and provided this initial description. Feel free to edit it to better reflect your goals.\n\nSome key aspects of your project:\n- Building a project management tool\n- Using AI to help users finish what they start\n- Implementing a Kanban board for task tracking\n- Providing personalized suggestions through AI',
    status: 'in-progress',
    createdAt: Date.now() - 1000000,
    updatedAt: Date.now(),
  })

  const [isLoading, setIsLoading] = useState(false)

  // This function would normally save to Firebase
  const updateProjectDescription = async (newDescription: string) => {
    setIsLoading(true)
    try {
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update local state
      setProject({
        ...project,
        description: newDescription,
        updatedAt: Date.now(),
      })

      // In a real app, you would save to Firebase here
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box>
      <Heading mb={6}>{project.title}</Heading>

      <Tabs colorScheme='blue' variant='enclosed' isLazy>
        <TabList>
          <Tab>Kanban Board</Tab>
          <Tab>Overview</Tab>
          <Tab>AI Insights</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <KanbanBoard />
          </TabPanel>
          <TabPanel>
            <ProjectOverview
              project={project}
              onUpdateDescription={updateProjectDescription}
            />
          </TabPanel>
          <TabPanel>
            <Box p={4}>AI suggestions and insights will go here</Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}
