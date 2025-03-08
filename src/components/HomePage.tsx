import React from 'react'
import { Box, Heading, Text, Button, VStack, Link } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

export const HomePage = () => {
  return (
    <VStack spacing={8} textAlign='center' py={10}>
      <Heading as='h1' size='2xl'>
        Project Compass
      </Heading>
      <Text fontSize='xl' maxW='container.md' mx='auto'>
        AI-powered project management to help you finish what you start
      </Text>
      <Box>
        <Button
          colorScheme='blue'
          size='lg'
          as={RouterLink}
          to='/projects/demo'
        >
          View Demo Project
        </Button>
      </Box>

      {/* Placeholder for project dashboard */}
      {/* 
        Future features:
        - Project cards
        - AI project generation
        - Kanban board
      */}
    </VStack>
  )
}
