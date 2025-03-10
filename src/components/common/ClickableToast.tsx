import React from 'react'
import { Box, Text, Flex } from '@chakra-ui/react'

interface ClickableToastProps {
  message: string
  subtext?: string
  type: 'info' | 'success' | 'warning' | 'error'
  onClick: () => void
  onClose: () => void
  bg?: string
  color?: string
}

const toastBgColors = {
  info: 'blue.500',
  success: 'green.500',
  warning: 'orange.500',
  error: 'red.500',
}

export const ClickableToast: React.FC<ClickableToastProps> = ({
  message,
  subtext,
  type,
  onClick,
  onClose,
  bg = toastBgColors[type],
  color = 'white',
}) => {
  const handleClick = () => {
    onClick()
    onClose()
  }

  return (
    <Box
      p={3}
      bg={bg}
      color={color}
      borderRadius='md'
      cursor='pointer'
      onClick={handleClick}
      shadow='md'
      _hover={{ opacity: 0.9 }}
    >
      <Flex align='center'>
        <Text fontWeight='medium'>{message}</Text>
        {subtext && (
          <Text ml={2} fontSize='sm'>
            {subtext}
          </Text>
        )}
      </Flex>
    </Box>
  )
}
