import React, { useState } from 'react'
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  useColorModeValue,
  Collapse,
  Divider,
  IconButton,
  Flex,
  useToast,
  Tooltip,
} from '@chakra-ui/react'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  AddIcon,
  ChatIcon,
} from '@chakra-ui/icons'
import { BsBookmark } from 'react-icons/bs'
import { AiInsight, KanbanTask, Project } from '../../types'

interface AiInsightsProps {
  project: Project
  insights: AiInsight[]
  onDismissInsight: (insightId: string) => Promise<void>
  onImplementInsight: (insightId: string) => Promise<void>
  onViewInsight: (insightId: string) => Promise<void>
  onSaveInsight: (insightId: string) => Promise<void>
  onCreateTask: (task: Partial<KanbanTask>) => Promise<void>
  onAskFollowUp: (insightId: string, question: string) => Promise<void>
}

// Mapping for badge colors by insight type
const insightTypeColors = {
  improvement: 'blue',
  feature: 'green',
  pivot: 'purple',
  risk: 'red',
  optimization: 'orange',
}

export const AiInsights: React.FC<AiInsightsProps> = ({
  project,
  insights,
  onDismissInsight,
  onImplementInsight,
  onViewInsight,
  onSaveInsight,
  onCreateTask,
  onAskFollowUp,
}) => {
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(
    null
  )
  const [loadingInsightId, setLoadingInsightId] = useState<string | null>(null)
  const toast = useToast()

  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Filter to show active and saved insights separately
  const activeInsights = insights.filter((insight) =>
    ['new', 'viewed'].includes(insight.status)
  )

  const savedInsights = insights.filter((insight) => insight.status === 'saved')

  const toggleExpand = (insightId: string) => {
    if (expandedInsightId === insightId) {
      setExpandedInsightId(null)
    } else {
      setExpandedInsightId(insightId)

      // Mark as viewed if it was new
      const insight = insights.find((i) => i.id === insightId)
      if (insight && insight.status === 'new') {
        onViewInsight(insightId).catch((err) =>
          console.error('Error marking insight as viewed:', err)
        )
      }
    }
  }

  const handleDismiss = async (insightId: string) => {
    setLoadingInsightId(insightId)
    try {
      await onDismissInsight(insightId)
      toast({
        title: 'Insight dismissed',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Error dismissing insight',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoadingInsightId(null)
    }
  }

  const handleImplement = async (insightId: string) => {
    setLoadingInsightId(insightId)
    try {
      await onImplementInsight(insightId)
      toast({
        title: 'Insight marked as implemented',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Error updating insight',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoadingInsightId(null)
    }
  }

  const handleCreateTask = async (
    insight: AiInsight,
    taskIndex: number = 0
  ) => {
    if (!insight.suggestedTasks || !insight.suggestedTasks[taskIndex]) return

    setLoadingInsightId(insight.id)
    try {
      const suggestedTask = insight.suggestedTasks[taskIndex]
      await onCreateTask({
        title: suggestedTask.title,
        description: suggestedTask.description,
        priority: suggestedTask.priority,
      })
      toast({
        title: 'Task created',
        description: `"${suggestedTask.title}" added to your kanban board`,
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Error creating task',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoadingInsightId(null)
    }
  }

  const handleConvertToTask = async (insight: AiInsight) => {
    setLoadingInsightId(insight.id)
    try {
      // Create a task from the insight
      await onCreateTask({
        title: `[${insight.type}] ${insight.title}`,
        description: `${insight.description}\n\n(Generated from AI insight)`,
        priority: insight.type === 'risk' ? 'high' : 'medium',
        tags: [insight.type],
      })

      // Remove the auto-implementation
      // await onImplementInsight(insight.id)

      toast({
        title: 'Insight added to Kanban board',
        description: 'The insight has been converted to a task',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Error creating task',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoadingInsightId(null)
    }
  }

  const handleSave = async (insightId: string) => {
    setLoadingInsightId(insightId)
    try {
      await onSaveInsight(insightId)
      toast({
        title: 'Insight saved',
        description: 'The insight has been saved for later reference',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Error saving insight',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoadingInsightId(null)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const handleAskFollowUp = async (insightId: string) => {
    try {
      // Standardize the follow-up question
      await onAskFollowUp(insightId, 'Tell me more about this insight')

      // The toast is now only shown here, not in both places
    } catch (error) {
      console.error('Error asking follow-up:', error)
      toast({
        title: 'Error asking follow-up question',
        status: 'error',
        duration: 3000,
      })
    }
  }

  if (activeInsights.length === 0 && savedInsights.length === 0) {
    return (
      <Box textAlign='center' py={10}>
        <Heading size='md' mb={4}>
          No AI Insights
        </Heading>
        <Text color='gray.500'>
          AI insights will appear here periodically as your project progresses.
          Check back later!
        </Text>
      </Box>
    )
  }

  return (
    <Box>
      <Heading size='md' mb={6}>
        AI Project Insights
      </Heading>
      <Text mb={8}>
        Based on your project progress, the AI has generated these insights to
        help you succeed. New insights are generated every 30-60 minutes as you
        work on your project.
      </Text>

      {activeInsights.length > 0 && (
        <>
          <Heading size='sm' mb={4}>
            Active Insights
          </Heading>
          <VStack
            spacing={4}
            align='stretch'
            mb={savedInsights.length > 0 ? 10 : 0}
          >
            {activeInsights.map((insight) => (
              <Box
                key={insight.id}
                borderWidth='1px'
                borderRadius='lg'
                overflow='hidden'
                bg={cardBg}
                borderColor={borderColor}
                boxShadow='sm'
              >
                <Flex
                  p={4}
                  onClick={() => toggleExpand(insight.id)}
                  cursor='pointer'
                  justifyContent='space-between'
                  alignItems='center'
                >
                  <Box>
                    <HStack mb={1}>
                      <Heading size='sm'>{insight.title}</Heading>
                      <Badge colorScheme={insightTypeColors[insight.type]}>
                        {insight.type}
                      </Badge>
                      {insight.status === 'new' && (
                        <Badge colorScheme='purple'>New</Badge>
                      )}
                    </HStack>
                    <Text fontSize='sm' color='gray.500'>
                      Generated {formatDate(insight.createdAt)}
                    </Text>
                  </Box>
                  <IconButton
                    aria-label='Expand insight'
                    icon={
                      expandedInsightId === insight.id ? (
                        <ChevronUpIcon />
                      ) : (
                        <ChevronDownIcon />
                      )
                    }
                    variant='ghost'
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(insight.id)
                    }}
                  />
                </Flex>

                <Collapse in={expandedInsightId === insight.id} animateOpacity>
                  <Box p={4} pt={0}>
                    <Divider mb={4} />
                    <Text mb={4} whiteSpace='pre-wrap'>
                      {insight.description}
                    </Text>

                    {insight.suggestedTasks &&
                      insight.suggestedTasks.length > 0 && (
                        <Box mt={4}>
                          <Heading size='xs' mb={2}>
                            Suggested Tasks
                          </Heading>
                          <VStack align='stretch' spacing={2}>
                            {insight.suggestedTasks.map((task, index) => (
                              <Box
                                key={index}
                                p={3}
                                borderWidth='1px'
                                borderRadius='md'
                                borderColor={borderColor}
                              >
                                <Flex
                                  justifyContent='space-between'
                                  alignItems='center'
                                >
                                  <Box>
                                    <Text fontWeight='bold'>{task.title}</Text>
                                    <Text fontSize='sm'>
                                      {task.description}
                                    </Text>
                                  </Box>
                                  <Tooltip label='Add to Kanban board'>
                                    <IconButton
                                      aria-label='Create task'
                                      icon={<AddIcon />}
                                      size='sm'
                                      colorScheme='blue'
                                      isLoading={
                                        loadingInsightId === insight.id
                                      }
                                      onClick={() =>
                                        handleCreateTask(insight, index)
                                      }
                                    />
                                  </Tooltip>
                                </Flex>
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      )}

                    <HStack spacing={2} mt={4} justifyContent='flex-end'>
                      <Button
                        size='sm'
                        leftIcon={<AddIcon />}
                        colorScheme='blue'
                        isLoading={loadingInsightId === insight.id}
                        onClick={() => handleConvertToTask(insight)}
                      >
                        Add to Kanban
                      </Button>
                      <Button
                        size='sm'
                        leftIcon={<ChatIcon />}
                        variant='outline'
                        onClick={() => handleAskFollowUp(insight.id)}
                      >
                        Ask Follow-up
                      </Button>
                      <Button
                        size='sm'
                        colorScheme='red'
                        variant='ghost'
                        leftIcon={<CloseIcon />}
                        isLoading={loadingInsightId === insight.id}
                        onClick={() => handleDismiss(insight.id)}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size='sm'
                        colorScheme='purple'
                        leftIcon={<BsBookmark />}
                        isLoading={loadingInsightId === insight.id}
                        onClick={() => handleSave(insight.id)}
                      >
                        Save for Later
                      </Button>
                    </HStack>
                  </Box>
                </Collapse>
              </Box>
            ))}
          </VStack>
        </>
      )}

      {savedInsights.length > 0 && (
        <Box mt={activeInsights.length > 0 ? 10 : 0}>
          <Heading size='md' mb={4}>
            Saved Insights
          </Heading>
          <Text mb={5}>Insights you've saved for future reference.</Text>
          <VStack spacing={4} align='stretch'>
            {savedInsights.map((insight) => (
              <Box
                key={insight.id}
                borderWidth='1px'
                borderRadius='lg'
                overflow='hidden'
                bg={cardBg}
                borderColor={borderColor}
                boxShadow='sm'
              >
                <Flex
                  p={4}
                  justifyContent='space-between'
                  onClick={() => toggleExpand(insight.id)}
                  cursor='pointer'
                >
                  <HStack spacing={2}>
                    <Badge colorScheme={insightTypeColors[insight.type]}>
                      {insight.type}
                    </Badge>
                    <Heading size='sm'>{insight.title}</Heading>
                    {insight.status === 'new' && (
                      <Badge colorScheme='green'>New</Badge>
                    )}
                  </HStack>
                  <IconButton
                    aria-label={
                      expandedInsightId === insight.id ? 'Collapse' : 'Expand'
                    }
                    icon={
                      expandedInsightId === insight.id ? (
                        <ChevronUpIcon />
                      ) : (
                        <ChevronDownIcon />
                      )
                    }
                    size='sm'
                    variant='ghost'
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(insight.id)
                    }}
                  />
                </Flex>

                <Collapse in={expandedInsightId === insight.id}>
                  <Box p={4} pt={0}>
                    <Divider mb={4} />
                    <Text mb={4}>{insight.description}</Text>
                    <Text fontSize='sm' color='gray.500' mb={4}>
                      Created: {formatDate(insight.createdAt)}
                    </Text>

                    {insight.suggestedTasks &&
                      insight.suggestedTasks.length > 0 && (
                        <Box mb={4}>
                          <Heading size='xs' mb={2}>
                            Suggested Tasks
                          </Heading>
                          <VStack spacing={2} align='stretch'>
                            {insight.suggestedTasks.map((task, index) => (
                              <Box
                                key={index}
                                p={3}
                                borderWidth='1px'
                                borderRadius='md'
                                borderColor={borderColor}
                              >
                                <Flex
                                  justifyContent='space-between'
                                  alignItems='center'
                                >
                                  <Box>
                                    <Text fontWeight='bold'>{task.title}</Text>
                                    <Text fontSize='sm'>
                                      {task.description}
                                    </Text>
                                  </Box>
                                  <Tooltip label='Add to Kanban board'>
                                    <IconButton
                                      aria-label='Create task'
                                      icon={<AddIcon />}
                                      size='sm'
                                      colorScheme='blue'
                                      isLoading={
                                        loadingInsightId === insight.id
                                      }
                                      onClick={() =>
                                        handleCreateTask(insight, index)
                                      }
                                    />
                                  </Tooltip>
                                </Flex>
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      )}

                    <HStack spacing={2} mt={4} justifyContent='flex-end'>
                      <Button
                        size='sm'
                        leftIcon={<AddIcon />}
                        colorScheme='blue'
                        isLoading={loadingInsightId === insight.id}
                        onClick={() => handleConvertToTask(insight)}
                      >
                        Add to Kanban
                      </Button>
                      <Button
                        size='sm'
                        leftIcon={<ChatIcon />}
                        variant='outline'
                        onClick={() => handleAskFollowUp(insight.id)}
                      >
                        Ask Follow-up
                      </Button>
                      <Button
                        size='sm'
                        colorScheme='red'
                        variant='ghost'
                        leftIcon={<CloseIcon />}
                        isLoading={loadingInsightId === insight.id}
                        onClick={() => handleDismiss(insight.id)}
                      >
                        Dismiss
                      </Button>
                    </HStack>
                  </Box>
                </Collapse>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  )
}
