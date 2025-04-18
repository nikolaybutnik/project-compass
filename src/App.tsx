import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'
import theme from '@//shared/config/theme'
import { useInitAuth } from '@/shared/store/authStore'
import { AIProvider } from '@/features/ai/context/aiContext'
import { ChatContainer } from '@/features/chat/components/ChatContainer'

function App(): JSX.Element {
  useInitAuth()

  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <AIProvider>
          <AppRoutes />
          <ChatContainer />
        </AIProvider>
      </BrowserRouter>
    </ChakraProvider>
  )
}

export default App
