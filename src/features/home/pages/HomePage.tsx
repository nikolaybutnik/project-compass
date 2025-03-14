import React from 'react'
import { Heading, Text, Button, VStack, HStack } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

export const HomePage: React.FC = () => {
  return (
    <VStack spacing={8} textAlign='center' py={10}>
      <Heading as='h1' size='2xl'>
        Project Compass
      </Heading>
      <Text fontSize='xl' maxW='container.md' mx='auto'>
        AI-powered project management to help you finish what you start
      </Text>
      <HStack spacing={4}>
        <Button
          colorScheme='blue'
          size='lg'
          as={RouterLink}
          to='/projects/demo'
        >
          View Demo Project
        </Button>
        <Button colorScheme='green' size='lg' as={RouterLink} to='/login'>
          Login / Sign Up
        </Button>
      </HStack>
    </VStack>
  )
}
