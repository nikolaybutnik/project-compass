import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { SimpleLayout } from './layouts/SimpleLayout'
import AppRoutes from './routes'
import theme from './config/theme'

function App(): JSX.Element {
  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <SimpleLayout>
          <AppRoutes />
        </SimpleLayout>
      </BrowserRouter>
    </ChakraProvider>
  )
}

export default App
