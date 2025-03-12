import React, { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  Button,
  SimpleGrid,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Flex,
} from '@chakra-ui/react'
import { AddIcon } from '@chakra-ui/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/useAuth'
import { Project } from '@/shared/types'
import { createProject } from '@/features/projects/services/projectsService'
import { ProjectCard } from '@/features/projects/components/ProjectCard'
import { getProjects } from '@/features/projects/services/projectsService'
import { ROUTES } from '@/shared/constants'

export const ProjectsListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return

      try {
        setLoading(true)
        const userProjects = await getProjects(user?.id)
        setProjects(userProjects)
      } catch (err) {
        console.error('Error loading projects:', err)
        setError(
          err instanceof Error ? err : new Error('Failed to load projects')
        )
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [user])

  const handleCreateProject = async () => {
    if (!user) return

    try {
      setIsCreating(true)
      await createProject(user?.id, {
        title: newProjectTitle,
        description: newProjectDescription,
      })
      setNewProjectTitle('')
      setNewProjectDescription('')
      onClose()
    } catch (err) {
      console.error('Error creating project:', err)
      setError(
        err instanceof Error ? err : new Error('Failed to create project')
      )
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Box p={5}>
      <Flex justifyContent='space-between' alignItems='center' mb={6}>
        <Heading>My Projects</Heading>
        <Button leftIcon={<AddIcon />} colorScheme='blue' onClick={onOpen}>
          New Project
        </Button>
      </Flex>

      {loading ? (
        <Center>
          <Spinner size='xl' />
        </Center>
      ) : projects?.length ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {projects?.map((project) => (
            <ProjectCard
              key={project?.id}
              project={project}
              onClick={() =>
                // TODO: refactor this to make it cleaner
                navigate(`/projects/${project?.id}`)
              }
            />
          ))}
        </SimpleGrid>
      ) : (
        <Center flexDirection='column' py={10}>
          <Text mb={4}>You don't have any projects yet.</Text>
          <Button colorScheme='blue' onClick={onOpen}>
            Create your first project
          </Button>
        </Center>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isRequired>
              <FormLabel>Project Title</FormLabel>
              <Input
                placeholder='Enter a title for your project'
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e?.target?.value)}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Description</FormLabel>
              <Textarea
                placeholder="What's this project about? (optional)"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e?.target?.value)}
                resize='vertical'
                rows={4}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant='ghost' mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme='blue'
              isLoading={isCreating}
              isDisabled={!newProjectTitle.trim()}
              onClick={handleCreateProject}
            >
              Create Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
