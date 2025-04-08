import React from 'react'
import {
  Box,
  Heading,
  Textarea,
  Flex,
  Badge,
  IconButton,
} from '@chakra-ui/react'
import { Project } from '@/shared/types'
import { EditIcon } from '@chakra-ui/icons'

interface ProjectOverviewTabProps {
  project: Project | null
  content: string
  isEditing: boolean
  setIsEditing: (isEditing: boolean) => void
  onUpdate: (
    event:
      | React.FocusEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => void
  onChange: (value: string) => void
}

export const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({
  project,
  content,
  isEditing,
  setIsEditing,
  onUpdate,
  onChange,
}) => {
  if (!project) {
    return null
  }

  return (
    <Box>
      <Flex justify='space-between' align='center' mb={4}>
        <Heading size='md'>Project Details</Heading>
        <Badge
          colorScheme={project.status === 'in-progress' ? 'blue' : 'gray'}
          fontSize='sm'
          px={2}
          py={1}
        >
          {project.status.replace('-', ' ')}
        </Badge>
      </Flex>

      <Box mb={8}>
        {isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onUpdate}
            onKeyDown={onUpdate}
            autoFocus
            minHeight='200px'
            placeholder='Describe your project...'
          />
        ) : (
          <Flex direction='column' gap={2}>
            <Box
              p={4}
              borderWidth='1px'
              borderRadius='md'
              minHeight='200px'
              whiteSpace='pre-wrap'
            >
              {content || 'No project description provided.'}
            </Box>
            <IconButton
              aria-label='Edit description'
              icon={<EditIcon />}
              size='sm'
              alignSelf='flex-start'
              onClick={() => setIsEditing(true)}
            />
          </Flex>
        )}
      </Box>
    </Box>
  )
}
