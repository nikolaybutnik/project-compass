import React from 'react'
import {
  Box,
  Container,
  Heading,
  Link,
  Button,
  Flex,
  useToast,
  Avatar,
  HStack,
  Text,
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { logout } from '@/services/auth/authService'
import { useAuth } from '@/hooks/useAuth'

interface SimpleLayoutProps {
  children: React.ReactNode
}

export const SimpleLayout = ({ children }: SimpleLayoutProps): JSX.Element => {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: 'Logged out successfully',
        status: 'success',
        duration: 3000,
      })
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast({
        title: 'Logout failed',
        description: 'Could not log out. Please try again.',
        status: 'error',
        duration: 3000,
      })
    }
  }

  return (
    <Box minH='100vh' bg='gray.50'>
      <Box as='header' bg='white' boxShadow='sm' p={4}>
        <Container maxW='container.xl'>
          <Flex justify='space-between' align='center'>
            <Link as={RouterLink} to='/' _hover={{ textDecoration: 'none' }}>
              <Heading size='md' color='brand.500'>
                Project Compass
              </Heading>
            </Link>

            {user && (
              <HStack spacing={4}>
                <HStack>
                  <Avatar
                    size='sm'
                    name={user.displayName || undefined}
                    src={user.photoURL || undefined}
                  />
                  <Text fontSize='sm' display={{ base: 'none', md: 'block' }}>
                    {user.email}
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
      <Container maxW='container.xl' py={8}>
        {children}
      </Container>
    </Box>
  )
}

// This is a simplified layout - a more complex one with sidebar,
// user menu, etc. will be implemented later
