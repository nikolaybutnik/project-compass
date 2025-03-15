import React, { useEffect } from 'react'
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

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { data: projects, isLoading, error } = useProjectsQuery(user?.id || '')

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
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
              <Link as={RouterLink} to='/' _hover={{ textDecoration: 'none' }}>
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
                    name={user.displayName || undefined}
                    src={user.photoURL || undefined}
                  />
                  <Text fontSize='sm' display={{ base: 'none', md: 'block' }}>
                    {user.displayName}
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
            <SideMenu onClose={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>{' '}
    </>
  )
}
