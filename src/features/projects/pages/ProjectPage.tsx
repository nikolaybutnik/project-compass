import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  FocusEvent,
  KeyboardEvent,
} from 'react'
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
  Box,
  VStack,
  Spinner,
  Input,
  useColorModeValue,
  UnorderedList,
  Code,
  OrderedList,
  ListItem,
  IconButton,
  HStack,
} from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import { KanbanBoardTab } from '@/features/projects/components/tabs/KanbanBoardTab'
import {
  updateProjectDescriptionMutation,
  updateProjectTitleMutation,
  useProjectQuery,
} from '@/shared/store/projectsStore'
import { useAuth } from '@/shared/store/authStore'
import { useSetActiveProjectMutation } from '@/shared/store/usersStore'
import { useAI } from '@/features/ai/context/aiContext'
import ReactMarkdown from 'react-markdown'
import { MessageRole } from '@/features/ai/types'
import { EditIcon } from '@chakra-ui/icons'
import { ProjectOverviewTab } from '../components/tabs/ProjectOverviewTab'

enum ProjectViewTabs {
  KANBAN = 0,
  OVERVIEW = 1,
  INSIGHTS = 2,
  CHAT = 3,
}

export const ProjectPage: React.FC = () => {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const {
    data: project,
    isLoading: isProjectLoading,
    error,
  } = useProjectQuery(projectId || '')
  const { user } = useAuth()
  const setActiveProjectMutation = useSetActiveProjectMutation()
  const updateTitle = updateProjectTitleMutation()
  const updateDescription = updateProjectDescriptionMutation()
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

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (project) {
      updateProjectContext(project)
    }
  }, [project, updateProjectContext])

  const [chatInput, setChatInput] = useState('')
  const [isSettingActive, setIsSettingActive] = useState(false)
  const [tabIndex, setTabIndex] = useState(ProjectViewTabs.KANBAN)
  const [projectTitle, setProjectTitle] = useState(project?.title || '')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [projectDescription, setProjectDescription] = useState(
    project?.description || ''
  )
  const [isEditingDescription, setIsEditingDescription] = useState(false)

  const userBgColor = useColorModeValue('blue.100', 'blue.900')
  const aiBgColor = useColorModeValue('gray.200', 'gray.700')
  const eventBgColor = useColorModeValue('yellow.100', 'gray.800')

  useEffect(() => {
    setProjectTitle(project?.title || '')
  }, [project?.title])

  useEffect(() => {
    setProjectDescription(project?.description || '')
  }, [project?.description])

  // Auto-scroll to bottom when messages change or when switching to chat tab
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Scroll to bottom when switching to the chat tab
  useEffect(() => {
    if (tabIndex === ProjectViewTabs.CHAT) {
      if (messagesEndRef.current) {
        const container = messagesEndRef.current.parentElement
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }
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

  const handleSetActiveProject = async (): Promise<void> => {
    if (!user || !projectId) return

    setIsSettingActive(true)

    try {
      await setActiveProjectMutation.mutateAsync({
        userId: user?.id,
        projectId,
      })
    } catch (error) {
      console.error('Failed to set active project:', error)
    } finally {
      setIsSettingActive(false)
    }
  }

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setChatInput(e.target.value)
    },
    []
  )

  const handleSendMessage = async (): Promise<void> => {
    if (!chatInput.trim()) return

    try {
      await sendMessage(chatInput)
      setChatInput('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleTitleUpdate = (
    event: FocusEvent<HTMLInputElement> | KeyboardEvent<HTMLInputElement>
  ): void => {
    if ('key' in event) {
      if (event.key === 'Escape') {
        setIsEditingTitle(false)
        setProjectTitle(project ? project.title : '')
      }
      if (event.key !== 'Enter') return
    }

    const newTitle = event.currentTarget.value
    updateTitle.mutate(
      { projectId, newTitle },
      {
        onSuccess: () => {
          setProjectTitle(newTitle)
          setIsEditingTitle(false)
        },
      }
    )
  }

  const handleDescriptionUpdate = (
    event: FocusEvent<HTMLTextAreaElement> | KeyboardEvent<HTMLTextAreaElement>
  ): void => {
    if ('key' in event) {
      if (event.key === 'Escape') {
        setIsEditingDescription(false)
        setProjectDescription(project ? project.description : '')
      }
      if (!event.metaKey || event.key !== 'Enter') return
    }

    const newDescription = event.currentTarget.value
    updateDescription.mutate(
      { projectId, newDescription },
      {
        onSuccess: () => {
          setProjectDescription(newDescription)
          setIsEditingDescription(false)
        },
      }
    )
  }

  return (
    <>
      <Flex justify='space-between' align='center' mb={6}>
        <HStack>
          {isEditingTitle ? (
            <Input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={handleTitleUpdate}
              onKeyDown={handleTitleUpdate}
              autoFocus
              variant='unstyled'
              fontSize='4xl'
              fontWeight='bold'
              height={50}
              p={0}
            />
          ) : (
            <>
              <Heading height={50}>{project?.title}</Heading>
              <IconButton
                aria-label='Edit title'
                icon={<EditIcon />}
                size='sm'
                onClick={() => setIsEditingTitle(true)}
              />
            </>
          )}
        </HStack>

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
          <TabPanel flex='1'>
            <ProjectOverviewTab
              project={project || null}
              content={projectDescription}
              isEditing={isEditingDescription}
              setIsEditing={setIsEditingDescription}
              onUpdate={handleDescriptionUpdate}
              onChange={setProjectDescription}
            />
          </TabPanel>
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
                  value={chatInput}
                  onChange={handleInputChange}
                  placeholder='Ask about your project...'
                  mr={2}
                  onKeyUp={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  colorScheme='blue'
                  onClick={handleSendMessage}
                  isLoading={isAiLoading}
                  isDisabled={!chatInput.trim()}
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
