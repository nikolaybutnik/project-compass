import React from 'react'
import { Box, Flex } from '@chakra-ui/react'

export const TypingIndicator: React.FC = () => {
  return (
    <Box
      alignSelf='flex-start'
      bg='gray.100'
      py={2}
      px={3}
      borderRadius='lg'
      maxWidth='70%'
      height='48px'
      boxShadow='sm'
      display='flex'
      justifyContent='center'
      alignItems='center'
      flexShrink={0}
      flexBasis='48px'
    >
      <Flex>
        <Box
          as='span'
          h='6px'
          w='6px'
          borderRadius='full'
          bg='gray.500'
          mx='1px'
          animation='blink 1.4s infinite 0.2s'
          sx={{
            '@keyframes blink': {
              '0%': { opacity: 0.2 },
              '20%': { opacity: 1 },
              '100%': { opacity: 0.2 },
            },
          }}
        />
        <Box
          as='span'
          h='6px'
          w='6px'
          borderRadius='full'
          bg='gray.500'
          mx='1px'
          animation='blink 1.4s infinite 0.4s'
          sx={{
            '@keyframes blink': {
              '0%': { opacity: 0.2 },
              '20%': { opacity: 1 },
              '100%': { opacity: 0.2 },
            },
          }}
        />
        <Box
          as='span'
          h='6px'
          w='6px'
          borderRadius='full'
          bg='gray.500'
          mx='1px'
          animation='blink 1.4s infinite 0.6s'
          sx={{
            '@keyframes blink': {
              '0%': { opacity: 0.2 },
              '20%': { opacity: 1 },
              '100%': { opacity: 0.2 },
            },
          }}
        />
      </Flex>
    </Box>
  )
}
