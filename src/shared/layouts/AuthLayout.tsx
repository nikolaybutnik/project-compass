import React from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Container, Heading, Link } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

export const AuthLayout: React.FC = () => {
  return (
    <Box minH='100vh' bg='gray.50'>
      <Box as='header' bg='white' boxShadow='sm' p={4} mb={4}>
        <Container maxW='container.xl'>
          <Link as={RouterLink} to='/' _hover={{ textDecoration: 'none' }}>
            <Heading size='md' color='brand.500'>
              Project Compass
            </Heading>
          </Link>
        </Container>
      </Box>
      <Container maxW='md'>
        <Outlet />
      </Container>
    </Box>
  )
}
