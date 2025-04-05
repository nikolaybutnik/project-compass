import React, { useState, useEffect, useRef } from 'react'
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

enum ProjectViewTabs {
  KANBAN = 0,
  OVERVIEW = 1,
  INSIGHTS = 2,
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
    resetContext,
    updateProjectContext,
    invalidateContext,
  } = useAI()

  useContextSync(projectId, invalidateContext)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (project) {
      updateProjectContext(project)
    }
  }, [project, updateProjectContext])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const [input, setInput] = useState('')
  const [isSettingActive, setIsSettingActive] = useState(false)
  const [tabIndex, setTabIndex] = useState(ProjectViewTabs.KANBAN)

  const isActiveProject = user?.activeProjectId === projectId

  const userBgColor = useColorModeValue('blue.100', 'blue.900')
  const aiBgColor = useColorModeValue('gray.200', 'gray.700')

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

  // TODO: full implementation pending
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
                {messages
                  .filter((msg) => msg.role !== 'system')
                  .map((msg, idx) => (
                    <Box
                      className='markdown-content'
                      key={idx}
                      p={3}
                      borderRadius='md'
                      bg={msg.role === 'user' ? userBgColor : aiBgColor}
                      alignSelf={
                        msg.role === 'user' ? 'flex-end' : 'flex-start'
                      }
                      maxW='80%'
                    >
                      <ReactMarkdown
                        components={{
                          p: (props) => <Text mb={2} {...props} />,
                          code: (props) => <Code p={1} {...props} />,
                          ul: (props) => (
                            <UnorderedList pl={4} mb={2} {...props} />
                          ),
                          ol: (props) => (
                            <OrderedList pl={4} mb={2} {...props} />
                          ),
                          li: (props) => <ListItem {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </Box>
                  ))}
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
                  onChange={(e) => setInput(e.target.value)}
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
