import React, { useState } from 'react'
import {
  VStack,
  Button,
  Divider,
  Text,
  Icon,
  Box,
  Flex,
  Collapse,
  List,
  ListItem,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import {
  FaUser,
  FaProjectDiagram,
  FaChevronDown,
  FaChevronRight,
  FaEllipsisH,
} from 'react-icons/fa'
import { useAuth } from '@/shared/hooks/useAuth'
import { ROUTES } from '@/shared/constants'

interface SideMenuProps {
  onClose: () => void
}

export const SideMenu: React.FC<SideMenuProps> = ({ onClose }) => {
  const { user } = useAuth()
  const [isProjectsOpen, setIsProjectsOpen] = useState(true)

  // Mock projects - replace with real data later
  const recentProjects = [
    { id: 'project1', name: 'Marketing Campaign' },
    { id: 'project2', name: 'Website Redesign' },
    { id: 'project3', name: 'Mobile App' },
  ]

  return (
    <Flex direction='column' h='100%' justify='space-between'>
      <VStack spacing={4} align='stretch'>
        <Text fontWeight='bold' fontSize='sm' color='gray.500'>
          NAVIGATION
        </Text>

        <Button
          as={RouterLink}
          to={ROUTES.HOME}
          variant='ghost'
          justifyContent='flex-start'
          leftIcon={<Icon as={FaProjectDiagram} />}
          onClick={onClose}
        >
          Name of Current Project
        </Button>

        <Box>
          <Button
            w='100%'
            variant='ghost'
            display='flex'
            justifyContent='flex-start'
            onClick={() => setIsProjectsOpen(!isProjectsOpen)}
            leftIcon={<Icon as={FaProjectDiagram} />}
          >
            Projects
            <Icon
              as={isProjectsOpen ? FaChevronDown : FaChevronRight}
              ml='auto'
            />
          </Button>

          <Collapse in={isProjectsOpen} animateOpacity>
            <List spacing={1} pl={6} mt={2}>
              {recentProjects.map((project) => (
                <ListItem key={project.id}>
                  <Button
                    as={RouterLink}
                    to={`${ROUTES.PROJECT}/${project.id}`}
                    variant='ghost'
                    size='sm'
                    justifyContent='flex-start'
                    w='100%'
                    onClick={onClose}
                  >
                    {project.name}
                  </Button>
                </ListItem>
              ))}
              <ListItem>
                <Button
                  as={RouterLink}
                  to={ROUTES.PROJECTS}
                  variant='ghost'
                  size='sm'
                  justifyContent='flex-start'
                  leftIcon={<Icon as={FaEllipsisH} fontSize='xs' />}
                  w='100%'
                  onClick={onClose}
                >
                  View all projects
                </Button>
              </ListItem>
            </List>
          </Collapse>
        </Box>

        <Divider />

        <Text fontWeight='bold' fontSize='sm' color='gray.500'>
          ACCOUNT
        </Text>

        <Button
          as={RouterLink}
          to={ROUTES.PROFILE}
          variant='ghost'
          justifyContent='flex-start'
          leftIcon={<Icon as={FaUser} />}
          onClick={onClose}
        >
          Profile Settings
        </Button>
      </VStack>

      <Box pt={6} pb={2}>
        <Text fontSize='xs' color='gray.500'>
          Version 0.1.0
        </Text>
      </Box>
    </Flex>
  )
}
