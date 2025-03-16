import React from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Container, Flex } from '@chakra-ui/react'
import { Header } from '@/shared/layouts/Header'

export const AppLayout: React.FC = () => {
  return (
    <Flex direction='column' minH='100vh' bg='gray.50'>
      <Header />
      <Container
        as={Flex}
        direction='column'
        maxW='container.xl'
        py={8}
        flex='1'
        overflow='hidden'
      >
        <Outlet />
      </Container>
    </Flex>
  )
}
