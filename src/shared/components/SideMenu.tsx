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
import { generatePath, Link as RouterLink } from 'react-router-dom'
import {
  FaUser,
  FaProjectDiagram,
  FaChevronDown,
  FaChevronRight,
  FaEllipsisH,
} from 'react-icons/fa'
import { ROUTES } from '@/shared/constants'
import { Project } from '@/shared/types'

interface SideMenuProps {
  activeProject: Project | null
  latestThreeProjects: Project[] | []
  onClose: () => void
}

export const SideMenu: React.FC<SideMenuProps> = ({
  activeProject,
  latestThreeProjects,
  onClose,
}) => {
  const appVersion = import.meta.env.VITE_APP_VERSION
  const [areProjectsExpanded, setAreProjectsExpanded] = useState(true)

  return (
    <Flex direction='column' h='100%' justify='space-between'>
      <VStack spacing={4} align='stretch'>
        <Text fontWeight='bold' fontSize='sm' color='gray.500'>
          NAVIGATION
        </Text>

        {activeProject?.id && (
          <Button
            as={RouterLink}
            to={generatePath(ROUTES.PROJECT, { projectId: activeProject?.id })}
            variant='ghost'
            justifyContent='flex-start'
            leftIcon={<Icon as={FaProjectDiagram} />}
            onClick={onClose}
          >
            {activeProject?.title} Kanban
          </Button>
        )}

        <Box>
          <Button
            w='100%'
            variant='ghost'
            display='flex'
            justifyContent='flex-start'
            onClick={() => setAreProjectsExpanded(!areProjectsExpanded)}
            leftIcon={<Icon as={FaProjectDiagram} />}
          >
            Projects
            <Icon
              as={areProjectsExpanded ? FaChevronDown : FaChevronRight}
              ml='auto'
            />
          </Button>

          <Collapse in={areProjectsExpanded} animateOpacity>
            <List spacing={1} pl={6} mt={2}>
              {latestThreeProjects?.map((project) => (
                <ListItem key={project.id}>
                  <Button
                    as={RouterLink}
                    to={generatePath(ROUTES.PROJECT, {
                      projectId: project?.id,
                    })}
                    variant='ghost'
                    size='sm'
                    justifyContent='flex-start'
                    w='100%'
                    onClick={onClose}
                  >
                    {project?.title}
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

        {/* TODO: NOT IMPLEMENTED YET */}
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
          Version {appVersion}
        </Text>
      </Box>
    </Flex>
  )
}
