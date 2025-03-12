import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'
import theme from '@//shared/config/theme'

function App(): JSX.Element {
  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ChakraProvider>
  )
}

export default App
