import { extendTheme } from '@chakra-ui/react'

// Basic theme configuration
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#bae7ff',
      500: '#1890ff', // Primary brand color
      600: '#096dd9',
      900: '#002766',
    },
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
})

export default theme

// More theme customization will be added later
