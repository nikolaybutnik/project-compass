import React, { useState, useEffect, FocusEvent, KeyboardEvent } from 'react'
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
  Input,
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
  const { updateProjectContext } = useAI()

  useEffect(() => {
    if (project) {
      updateProjectContext(project)
    }
  }, [project, updateProjectContext])

  const [isSettingActive, setIsSettingActive] = useState(false)
  const [tabIndex, setTabIndex] = useState(ProjectViewTabs.KANBAN)
  const [projectTitle, setProjectTitle] = useState(project?.title || '')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [projectDescription, setProjectDescription] = useState(
    project?.description || ''
  )
  const [isEditingDescription, setIsEditingDescription] = useState(false)

  useEffect(() => {
    setProjectTitle(project?.title || '')
  }, [project?.title])

  useEffect(() => {
    setProjectDescription(project?.description || '')
  }, [project?.description])

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
        </TabList>

        <TabPanels display='flex' flex='1'>
          <TabPanel flex='1' pb={0}>
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
        </TabPanels>
      </Tabs>
    </>
  )
}
