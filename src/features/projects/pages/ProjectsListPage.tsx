import React, { useState } from 'react'
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
  Flex,
} from '@chakra-ui/react'
import { AddIcon } from '@chakra-ui/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/store/authStore'
import { ProjectCard } from '@/features/projects/components/ProjectCard'
import {
  useCreateProjectMutation,
  useProjectsQuery,
} from '@/shared/store/projectsStore'

export const ProjectsListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: projects, isLoading, error } = useProjectsQuery(user?.id || '')
  const createProjectMutation = useCreateProjectMutation()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateProject = async () => {
    if (!user) return

    try {
      setIsCreating(true)
      await createProjectMutation.mutateAsync({
        userId: user?.id,
        projectData: {
          title: newProjectTitle,
          description: newProjectDescription,
        },
      })
      setNewProjectTitle('')
      setNewProjectDescription('')
      onClose()
    } catch (err) {
      console.error('Error creating project:', err)
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

      {isLoading ? (
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
