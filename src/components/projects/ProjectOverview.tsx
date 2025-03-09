import React, { useState } from 'react'
import {
  Box,
  Heading,
  Text,
  Textarea,
  Button,
  Flex,
  useToast,
  FormControl,
  FormLabel,
  Badge,
  Divider,
} from '@chakra-ui/react'
import { Project } from '../../types'

// Maximum length for project description to keep it efficient for AI context
const MAX_DESCRIPTION_LENGTH = 2000

interface ProjectOverviewProps {
  project: Project
  onUpdateDescription: (newDescription: string) => Promise<void>
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  onUpdateDescription,
}) => {
  const [description, setDescription] = useState(project.description)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const toast = useToast()

  const characterCount = description.length
  const isOverLimit = characterCount > MAX_DESCRIPTION_LENGTH

  const handleEdit = (): void => {
    setIsEditing(true)
  }

  const handleCancel = (): void => {
    setDescription(project.description)
    setIsEditing(false)
  }

  const handleSave = async (): Promise<void> => {
    if (isOverLimit) {
      toast({
        title: 'Description too long',
        description: `Please keep your description under ${MAX_DESCRIPTION_LENGTH} characters.`,
        status: 'error',
        duration: 3000,
      })
      return
    }

    setIsSaving(true)
    try {
      await onUpdateDescription(description)
      setIsEditing(false)
      toast({
        title: 'Project updated',
        description: 'Your project description has been saved.',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'There was an error updating your project.',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Box>
      <Heading size='md' mb={4}>
        Project Details
      </Heading>

      <Box mb={8}>
        <Flex justifyContent='space-between' alignItems='center' mb={2}>
          <FormLabel htmlFor='project-description' mb={0}>
            Project Description
          </FormLabel>
          <Badge
            colorScheme={project.status === 'in-progress' ? 'blue' : 'gray'}
          >
            {project.status.replace('-', ' ')}
          </Badge>
        </Flex>

        <FormControl>
          {isEditing ? (
            <>
              <Textarea
                id='project-description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Describe your project in detail. This description helps the AI understand your project context.'
                minHeight='200px'
                isInvalid={isOverLimit}
              />
              <Flex justifyContent='space-between' mt={2}>
                <Text
                  fontSize='sm'
                  color={isOverLimit ? 'red.500' : 'gray.500'}
                >
                  {characterCount}/{MAX_DESCRIPTION_LENGTH} characters
                </Text>
                <Flex gap={2}>
                  <Button size='sm' onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button
                    size='sm'
                    colorScheme='blue'
                    onClick={handleSave}
                    isLoading={isSaving}
                    loadingText='Saving'
                    disabled={isOverLimit}
                  >
                    Save
                  </Button>
                </Flex>
              </Flex>
            </>
          ) : (
            <>
              <Box
                p={4}
                borderWidth='1px'
                borderRadius='md'
                minHeight='200px'
                bg='gray.50'
                whiteSpace='pre-wrap'
              >
                {description || 'No project description provided.'}
              </Box>
              <Button mt={2} size='sm' onClick={handleEdit}>
                Edit Description
              </Button>
            </>
          )}
        </FormControl>
      </Box>

      <Divider my={6} />

      <Box>
        <Heading size='md' mb={4}>
          AI Context
        </Heading>
        <Text fontSize='sm' color='gray.600' mb={4}>
          This project description is used to give the AI context about your
          project when making suggestions and creating tasks. Keep it detailed
          yet concise for best results.
        </Text>
      </Box>
    </Box>
  )
}
