import React, { useState, useEffect } from 'react'
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
import { User } from 'firebase/auth'
import { auth } from '@/config/firebase'
interface SimpleLayoutProps {
  children: React.ReactNode
}

export const SimpleLayout = ({ children }: SimpleLayoutProps): JSX.Element => {
  const navigate = useNavigate()
  const toast = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user)
    })

    return () => unsubscribe()
  }, [])

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

            {currentUser && (
              <HStack spacing={4}>
                <HStack>
                  <Avatar
                    size='sm'
                    name={currentUser.displayName || undefined}
                    src={currentUser.photoURL || undefined}
                  />
                  <Text fontSize='sm' display={{ base: 'none', md: 'block' }}>
                    {currentUser.email}
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
