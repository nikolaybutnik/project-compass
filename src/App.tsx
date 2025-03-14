import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'
import theme from '@//shared/config/theme'
import { useInitAuth } from '@/shared/store/authStore'

function App(): JSX.Element {
  useInitAuth()

  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ChakraProvider>
  )
}

export default App
