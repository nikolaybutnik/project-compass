import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'
import theme from '@//shared/config/theme'
import { useInitAuth } from '@/shared/store/authStore'
import { AIProvider } from '@/features/ai/context/aiContext'

function App(): JSX.Element {
  useInitAuth()

  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <AIProvider>
          <AppRoutes />
        </AIProvider>
      </BrowserRouter>
    </ChakraProvider>
  )
}

export default App
