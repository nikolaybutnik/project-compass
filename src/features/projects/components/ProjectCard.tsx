import React from 'react'
import {
  Badge,
  Box,
  Flex,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from '@chakra-ui/react'
import { Project } from '@/shared/types'
import { FaEllipsisV } from 'react-icons/fa'
import { Timestamp } from 'firebase/firestore'

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
}) => {
  const statusColorMap: Record<string, string> = {
    planning: 'gray',
    'in-progress': 'blue',
    completed: 'green',
    abandoned: 'red',
  }

  const getStatusColor = (status: string) => statusColorMap[status] || 'gray'

  const formatDate = (timestamp: Timestamp): string => {
    if (!timestamp) return 'Unknown'

    const date = timestamp?.toDate()
    return date.toLocaleDateString()
  }

  const handleCardClick = (e: React.MouseEvent): void => {
    const isMenuClicked = (e?.target as HTMLElement)?.closest('.project-menu')
    if (isMenuClicked) return

    onClick()
  }

  return (
    <Box
      borderWidth='1px'
      borderRadius='lg'
      overflow='hidden'
      onClick={handleCardClick}
      cursor='pointer'
      transition='all 0.2s'
      _hover={{ transform: 'translateY(-4px)', shadow: 'md' }}
    >
      <Box p={4}>
        <Flex justifyContent='space-between' alignItems='center'>
          <Badge colorScheme={getStatusColor(project?.status)}>
            {project?.status?.replace('-', ' ')}
          </Badge>
          <Box className='project-menu'>
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label='Options'
                icon={<FaEllipsisV />}
                variant='ghost'
                size='sm'
              />
              <MenuList>
                <MenuItem onClick={() => {}}>Open</MenuItem>
              </MenuList>
            </Menu>
          </Box>
        </Flex>

        <Heading size='md' mt={2} noOfLines={1}>
          {project?.title}
        </Heading>

        <Box mt={2} fontSize='sm' color='gray.600' noOfLines={3}>
          {project?.description || 'No description provided.'}
        </Box>

        <Box mt={4} fontSize='xs' color='gray.500'>
          Created: {formatDate(project?.createdAt)}
        </Box>
        <Box fontSize='xs' color='gray.500'>
          Last updated: {formatDate(project?.updatedAt)}
        </Box>
      </Box>
    </Box>
  )
}
