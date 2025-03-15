import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Link,
  Button,
  Flex,
  Avatar,
  HStack,
  Text,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/store/authStore'
import { SideMenu } from '@/shared/components/SideMenu'
import { useProjectsQuery } from '@/shared/store/projectsStore'
import { Project } from '@/shared/types'
import { ROUTES } from '@/shared/constants'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { data: projects } = useProjectsQuery(user?.id || '')

  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [latestThreeProjects, setLatestThreeProjects] = useState<Project[]>([])

  useEffect(() => {
    setActiveProject(
      projects?.find((project) => project?.id === user?.activeProjectId) || null
    )
    setLatestThreeProjects(
      projects
        ?.filter((project) => project?.id !== user?.activeProjectId)
        .slice(0, 3) || []
    )
  }, [projects, user])

  const handleLogout = async () => {
    try {
      await signOut()
      navigate(ROUTES.LOGIN)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      <Box as='header' bg='white' boxShadow='sm' p={4}>
        <Container maxW='container.xl'>
          <Flex justify='space-between' align='center'>
            <Flex align='center'>
              {user && (
                <IconButton
                  icon={<HamburgerIcon />}
                  variant='ghost'
                  fontSize='20px'
                  mr={3}
                  aria-label='Open menu'
                  onClick={onOpen}
                />
              )}
              <Link
                as={RouterLink}
                to={ROUTES.HOME}
                _hover={{ textDecoration: 'none' }}
              >
                <Heading size='md' color='brand.500'>
                  Project Compass
                </Heading>
              </Link>
            </Flex>

            {user && (
              <HStack spacing={4}>
                <HStack>
                  <Avatar
                    size='sm'
                    name={user?.displayName || undefined}
                    src={user?.photoURL || undefined}
                  />
                  <Text fontSize='sm' display={{ base: 'none', md: 'block' }}>
                    {user?.displayName}
                  </Text>
                </HStack>
                <Button
                  colorScheme='blue'
                  variant='outline'
                  size='sm'
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </HStack>
            )}
          </Flex>
        </Container>
      </Box>
      <Drawer isOpen={isOpen} placement='left' onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth='1px'>Menu</DrawerHeader>
          <DrawerBody>
            <SideMenu
              onClose={onClose}
              activeProject={activeProject}
              latestThreeProjects={latestThreeProjects}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
