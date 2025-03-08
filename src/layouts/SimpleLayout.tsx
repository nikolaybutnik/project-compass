import React from 'react'
import { Box, Container, Flex, Heading } from '@chakra-ui/react'

interface SimpleLayoutProps {
  children: React.ReactNode
}

export const SimpleLayout = ({ children }: SimpleLayoutProps) => {
  return (
    <Box minH='100vh' bg='gray.50'>
      <Box as='header' bg='white' boxShadow='sm' p={4}>
        <Container maxW='container.xl'>
          <Heading size='md' color='brand.500'>
            Project Compass
          </Heading>
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
