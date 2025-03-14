import React, { useState } from 'react'
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Flex,
  Text,
  Badge,
  useToast,
} from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import { KanbanBoardTab } from '@/features/projects/components/tabs/KanbanBoardTab'
import { useProjectQuery } from '@/shared/store/projectsStore'
import { useAuth } from '@/shared/store/authStore'
import { useSetActiveProjectMutation } from '@/shared/store/authStore'

enum ProjectViewTabs {
  KANBAN = 0,
  OVERVIEW = 1,
  INSIGHTS = 2,
}

export const ProjectPage: React.FC = () => {
  const { projectId } = useParams()
  const { data: project, isLoading, error } = useProjectQuery(projectId || '')
  const { user } = useAuth()
  const setActiveProjectMutation = useSetActiveProjectMutation()
  const toast = useToast()
  const [isSettingActive, setIsSettingActive] = useState(false)

  const isActiveProject = user?.activeProjectId === projectId

  // Project state, will be replaced with real data from Firebase
  // const [project, setProject] = useState<Project | null>(null)
  // Mock data for tasks - will be replaced with real data from Firebase
  // const [tasks, setTasks] = useState<KanbanTask[]>([])
  // const [insights, setInsights] = useState<AiInsight[]>([])
  // const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  // const [error, setError] = useState<Error | null>(null)
  // const [isLoading, setIsLoading] = useState(false)
  const [tabIndex, setTabIndex] = useState(ProjectViewTabs.KANBAN)

  const handleSetActiveProject = async () => {
    if (!user || !projectId) return

    setIsSettingActive(true)
    try {
      await setActiveProjectMutation.mutateAsync({
        userId: user?.id,
        projectId,
      })
      toast({
        title: 'Project activated',
        description: 'This is now your active project',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Failed to set active project:', error)
      toast({
        title: 'Failed to set active project',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsSettingActive(false)
    }
  }

  // Re-enable insights generation with better error handling
  // useEffect(() => {
  //   let isMounted = true

  //   const loadInitialInsights = async () => {
  //     try {
  //       if (!project) return
  //       const newInsights = await generateInsights(project, tasks)

  //       if (isMounted) {
  //         setInsights((prev) => [...prev, ...newInsights])

  //         if (newInsights.length > 0) {
  //           showInsightNotification(newInsights.length)
  //         }
  //       }
  //     } catch (err) {
  //       console.error('Error loading initial insights:', err)
  //       if (isMounted) {
  //         setError(
  //           err instanceof Error
  //             ? err
  //             : new Error('Unknown error loading insights')
  //         )
  //       }
  //     }
  //   }

  //   loadInitialInsights()

  //   // Interval for periodic updates
  //   const intervalId = setInterval(
  //     () => {
  //       if (isMounted) {
  //         fetchInsights(true).catch((err) => {
  //           console.error('Error in scheduled insights update:', err)
  //         })
  //       }
  //     },
  //     1000 * 60 * 30
  //   ) // 30 minutes

  //   return () => {
  //     isMounted = false
  //     clearInterval(intervalId)
  //   }
  // }, [])

  // const showInsightNotification = (count: number): void => {
  //   toast({
  //     duration: 10000,
  //     render: ({ onClose }) => (
  //       <ClickableToast
  //         message={`${count} new AI insights available`}
  //         type='info'
  //         onClick={() => setTabIndex(ProjectViewTabs.INSIGHTS)}
  //         onClose={onClose}
  //       />
  //     ),
  //   })
  // }

  // const fetchInsights = async (silent: boolean = false) => {
  //   if (!silent) {
  //     setIsLoadingInsights(true)
  //   }

  //   try {
  //     if (!project) return
  //     const newInsights = await generateInsights(project, tasks)
  //     setInsights((prev) => [...prev, ...newInsights])

  //     if (!silent && newInsights.length > 0) {
  //       showInsightNotification(newInsights.length)
  //     }
  //   } catch (error) {
  //     console.error('Error fetching insights:', error)
  //     setError(error instanceof Error ? error : new Error('Unknown error'))

  //     if (!silent) {
  //       toast({
  //         title: 'Failed to generate insights',
  //         status: 'error',
  //         duration: 5000,
  //       })
  //     }
  //   } finally {
  //     if (!silent) {
  //       setIsLoadingInsights(false)
  //     }
  //   }
  // }

  // const clearInsights = () => {
  //   console.log('Before clearing:', insights)

  //   // Get only saved insights
  //   const savedInsights = insights.filter(
  //     (insight) => insight.status === 'saved'
  //   )
  //   console.log('Saved insights:', savedInsights)

  //   // Force re-render by using a two-step state update
  //   setInsights([])

  //   // Use setTimeout to ensure the empty array renders first
  //   setTimeout(() => {
  //     setInsights(savedInsights)
  //   }, 0)

  //   toast({
  //     title: 'Insights cleared',
  //     description: `All non-saved insights have been removed. Kept ${savedInsights.length} saved insights.`,
  //     status: 'info',
  //     duration: 3000,
  //   })
  // }

  // This function would normally save to Firebase
  // const updateProjectDescription = async (newDescription: string) => {
  //   setIsLoading(true)
  //   try {
  //     // Simulating API call
  //     await new Promise((resolve) => setTimeout(resolve, 1000))

  //     // Update local state
  //     // setProject({
  //     //   ...project,
  //     //   description: newDescription,
  //     //   updatedAt: Date.now(),
  //     // })

  //     // In a real app, you would save to Firebase here
  //   } catch (error) {
  //     console.error('Error updating project:', error)
  //     throw error
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  // Handle dismissing an insight
  // const handleDismissInsight = async (insightId: string) => {
  //   try {
  //     // Simulating API call
  //     await new Promise((resolve) => setTimeout(resolve, 500))

  //     // Update local state
  //     setInsights((prev) =>
  //       prev.map((insight) =>
  //         insight.id === insightId
  //           ? { ...insight, status: 'dismissed' }
  //           : insight
  //       )
  //     )

  //     // In a real app, you would update Firebase here
  //   } catch (error) {
  //     console.error('Error dismissing insight:', error)
  //     throw error
  //   }
  // }

  // Handle implementing an insight
  // const handleImplementInsight = async (insightId: string) => {
  //   try {
  //     // Simulating API call
  //     await new Promise((resolve) => setTimeout(resolve, 500))

  //     // Update local state
  //     setInsights((prev) =>
  //       prev.map((insight) =>
  //         insight.id === insightId
  //           ? { ...insight, status: 'implemented' }
  //           : insight
  //       )
  //     )

  //     // In a real app, you would update Firebase here
  //   } catch (error) {
  //     console.error('Error implementing insight:', error)
  //     throw error
  //   }
  // }

  // Handle creating a task from an insight
  // const handleCreateTask = async (task: Partial<KanbanTask>) => {
  //   try {
  //     // Simulating API call
  //     await new Promise((resolve) => setTimeout(resolve, 800))

  //     // Create new task
  //     // const newTask: KanbanTask = {
  //     //   id: uuidv4(),
  //     //   title: task.title || 'New Task',
  //     //   description: task.description || '',
  //     //   priority: task.priority || 'medium',
  //     //   tags: task.tags || [],
  //     //   createdAt: Date.now(),
  //     //   updatedAt: Date.now(),
  //     // }

  //     // Add to tasks
  //     // setTasks((prev) => [...prev, newTask])

  //     // In a real app, you would save to Firebase here
  //   } catch (error) {
  //     console.error('Error creating task:', error)
  //     throw error
  //   }
  // }

  // Handle asking a follow-up question about an insight
  // const handleAskFollowUp = async (insightId: string, question: string) => {
  //   // This would be implemented with AI chat capability
  //   console.log(`Follow-up for insight ${insightId}: ${question}`)

  //   // For now, just acknowledge the question
  //   toast({
  //     title: 'This feature is coming soon',
  //     description: 'Follow-up questions will be implemented in a future update',
  //     status: 'info',
  //     duration: 3000,
  //   })
  // }

  // Handle marking an insight as viewed
  // const handleViewInsight = async (insightId: string) => {
  //   try {
  //     // Update local state
  //     setInsights((prev) =>
  //       prev.map((insight) =>
  //         insight.id === insightId ? { ...insight, status: 'viewed' } : insight
  //       )
  //     )

  //     // In a real app, you would update Firebase here
  //   } catch (error) {
  //     console.error('Error marking insight as viewed:', error)
  //   }
  // }

  // Handle saving an insight for later
  // const handleSaveInsight = async (insightId: string) => {
  //   try {
  //     // Simulating API call
  //     await new Promise((resolve) => setTimeout(resolve, 500))

  //     // Update local state
  //     setInsights((prev) =>
  //       prev.map((insight) =>
  //         insight.id === insightId ? { ...insight, status: 'saved' } : insight
  //       )
  //     )

  //     // In a real app, you would update Firebase here
  //   } catch (error) {
  //     console.error('Error saving insight:', error)
  //     throw error
  //   }
  // }

  return (
    <Box>
      <Flex justify='space-between' align='center' mb={6}>
        <Heading>{project?.title}</Heading>

        {!isActiveProject && project && (
          <Flex align='center' bg='blue.50' p={2} borderRadius='md'>
            <Text color='blue.700' fontWeight='medium' mr={3}>
              Set this as your active project for quick access
            </Text>
            <Button
              colorScheme='blue'
              size='sm'
              onClick={handleSetActiveProject}
              isLoading={isSettingActive}
            >
              Set as Active
            </Button>
          </Flex>
        )}

        {isActiveProject && (
          <Badge colorScheme='green' p={2} borderRadius='md'>
            Active Project
          </Badge>
        )}
      </Flex>

      {/* {error && (
        <Box p={4} mb={4} bg='red.100' color='red.800' borderRadius='md'>
          <Heading size='md'>Error Loading Project</Heading>
          <Text>{error.message}</Text>
          <Button mt={2} onClick={() => setError(null)}>
            Dismiss
          </Button>
        </Box>
      )} */}

      <Tabs
        colorScheme='blue'
        variant='enclosed'
        index={tabIndex}
        onChange={setTabIndex}
        isLazy
      >
        <TabList>
          <Tab>Kanban Board</Tab>
          <Tab>Overview</Tab>
          <Tab>AI Insights</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <KanbanBoardTab
              project={project}
              isLoading={isLoading}
              error={error}
            />
          </TabPanel>
          <TabPanel>
            {/* <ProjectOverviewTab
              project={project}
              onUpdateDescription={updateProjectDescription}
            /> */}
          </TabPanel>
          <TabPanel>
            {/* <Box position='relative'>
              <Box mb={4} textAlign='right'>
                <Button
                  colorScheme='red'
                  size='sm'
                  mr={2}
                  onClick={clearInsights}
                >
                  Clear Insights
                </Button>
                <Button
                  colorScheme='blue'
                  size='sm'
                  isLoading={isLoadingInsights}
                  onClick={() => fetchInsights()}
                >
                  Generate New Insights
                </Button>
              </Box>

              <AiInsights
                project={project!}
                insights={insights}
                onDismissInsight={handleDismissInsight}
                onImplementInsight={handleImplementInsight}
                onViewInsight={handleViewInsight}
                onSaveInsight={handleSaveInsight}
                onCreateTask={handleCreateTask}
                onAskFollowUp={handleAskFollowUp}
              />
            </Box> */}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}
