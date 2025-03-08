import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SimpleLayout } from './components/SimpleLayout'
import { HomePage } from './components/HomePage'
import theme from './config/theme'

function App() {
  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <SimpleLayout>
          <Routes>
            <Route path='/' element={<HomePage />} />
            {/* Authentication routes will be added here */}
            {/* Project management routes will be added here */}
          </Routes>
        </SimpleLayout>
      </BrowserRouter>
    </ChakraProvider>
  )
}

export default App
