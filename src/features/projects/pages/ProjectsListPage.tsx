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
} from '@chakra-ui/react'
import { AddIcon } from '@chakra-ui/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/useAuth'
import { Project } from '@/shared/types'
import { createProject } from '@/features/projects/services/projectsService'
// import { ProjectCard } from '@/features/projects/components/ProjectCard'
import { getProjects } from '@/features/projects/services/projectsService'

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
        const userProjects = await getProjects(user.id)
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

  useEffect(() => {
    console.log('projects', projects)
  }, [projects])

  return (
    <>
      <button
        onClick={() => {
          createProject(user?.id, {
            title: newProjectTitle,
            description: newProjectDescription,
          })
        }}
      >
        Add Project
      </button>
    </>
  )
}
