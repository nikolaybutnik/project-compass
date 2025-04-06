import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
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
  Box,
  VStack,
  Spinner,
  Input,
  useColorModeValue,
  UnorderedList,
  Code,
  OrderedList,
  ListItem,
} from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import { KanbanBoardTab } from '@/features/projects/components/tabs/KanbanBoardTab'
import { useProjectQuery } from '@/shared/store/projectsStore'
import { useAuth } from '@/shared/store/authStore'
import { useSetActiveProjectMutation } from '@/shared/store/usersStore'
import { useAI } from '@/features/ai/context/aiContext'
import ReactMarkdown from 'react-markdown'
import { useContextSync } from '@/features/ai/hooks/useContextSync'
import { findTaskMentions } from '@/features/ai/utils/mentionUtils'
import { MessageRole } from '@/features/ai/types'

enum ProjectViewTabs {
  KANBAN = 0,
  OVERVIEW = 1,
  INSIGHTS = 2,
  CHAT = 3,
}

export const ProjectPage: React.FC = () => {
  const { projectId } = useParams()
  const {
    data: project,
    isLoading: isProjectLoading,
    error,
  } = useProjectQuery(projectId || '')
  const { user } = useAuth()
  const setActiveProjectMutation = useSetActiveProjectMutation()
  const toast = useToast()
  const {
    messages,
    isLoading: isAiLoading,
    sendMessage,
    updateProjectContext,
    invalidateContext,
    resetContext,
    refreshContext,
  } = useAI()

  // TODO: Troubleshoot projectLoading and aiLoading

  useContextSync(projectId, invalidateContext)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (project) {
      updateProjectContext(project)
    }
  }, [project, updateProjectContext])

  const [input, setInput] = useState('')
  const [isSettingActive, setIsSettingActive] = useState(false)
  const [tabIndex, setTabIndex] = useState(ProjectViewTabs.KANBAN)

  const userBgColor = useColorModeValue('blue.100', 'blue.900')
  const aiBgColor = useColorModeValue('gray.200', 'gray.700')
  const eventBgColor = useColorModeValue('yellow.100', 'gray.800')

  // Auto-scroll to bottom when messages change or when switching to chat tab
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Scroll to bottom when switching to the chat tab
  useEffect(() => {
    if (tabIndex === ProjectViewTabs.CHAT) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [tabIndex])

  // Memoize the message components to prevent re-renders on input changes
  const memoizedMessages = useMemo(() => {
    return messages
      .filter((msg) => msg.role !== MessageRole.SYSTEM)
      .map((msg, idx) => (
        <Box
          className='markdown-content'
          key={idx}
          p={3}
          borderRadius='md'
          bg={
            msg.role === MessageRole.USER
              ? userBgColor
              : msg.role === MessageRole.ASSISTANT
                ? aiBgColor
                : eventBgColor
          }
          alignSelf={msg.role === MessageRole.USER ? 'flex-end' : 'flex-start'}
          maxW='80%'
        >
          <ReactMarkdown
            components={{
              p: (props) => <Text mb={2} {...props} />,
              code: (props) => <Code p={1} {...props} />,
              ul: (props) => <UnorderedList pl={4} mb={2} {...props} />,
              ol: (props) => <OrderedList pl={4} mb={2} {...props} />,
              li: (props) => <ListItem {...props} />,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        </Box>
      ))
  }, [messages, userBgColor, aiBgColor])

  const isActiveProject = user?.activeProjectId === projectId

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

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value)
    },
    []
  )

  const handleSendMessage = async () => {
    if (!input.trim()) return

    try {
      await sendMessage(input)
      setInput('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <>
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

      <Tabs
        colorScheme='blue'
        variant='enclosed'
        display='flex'
        flexDirection='column'
        flex='1'
        index={tabIndex}
        onChange={setTabIndex}
        isLazy
      >
        <TabList>
          <Tab>Kanban Board</Tab>
          <Tab>Overview</Tab>
          <Tab>AI Insights</Tab>
          <Tab>CHAT TEST</Tab>
        </TabList>

        <TabPanels display='flex' flex='1'>
          <TabPanel flex='1'>
            <KanbanBoardTab
              project={project}
              isLoading={isProjectLoading}
              error={error}
            />
          </TabPanel>
          <TabPanel flex='1'>{/* TODO: Add Overview Tab */}</TabPanel>
          <TabPanel flex='1'>{/* TODO: Add AI Insights Tab */}</TabPanel>

          {/* Temporary Chat Test Tab */}
          <TabPanel
            flex='1'
            display='flex'
            flexDirection='column'
            h='calc(100vh - 250px)'
            overflow='hidden'
          >
            <Box h='full' display='flex' flexDirection='column'>
              <Flex justify='flex-end' mb={2}>
                <Button
                  size='sm'
                  onClick={refreshContext}
                  colorScheme='green'
                  variant='outline'
                  mr={2}
                >
                  Refresh Context
                </Button>
                <Button
                  size='sm'
                  onClick={resetContext}
                  colorScheme='blue'
                  variant='outline'
                >
                  Reset Chat
                </Button>
              </Flex>

              <VStack
                flex='1'
                overflowY='auto'
                spacing={4}
                p={4}
                borderWidth={1}
                borderRadius='md'
                mb={4}
                align='stretch'
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    width: '10px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '24px',
                  },
                }}
              >
                {memoizedMessages}
                {isAiLoading && (
                  <Flex justify='center'>
                    <Spinner />
                  </Flex>
                )}
                <div ref={messagesEndRef} />
              </VStack>

              <Flex mb={2}>
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder='Ask about your project...'
                  mr={2}
                  onKeyUp={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  colorScheme='blue'
                  onClick={handleSendMessage}
                  isLoading={isAiLoading}
                  isDisabled={!input.trim()}
                >
                  Send
                </Button>
              </Flex>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}
