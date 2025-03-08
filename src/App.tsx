import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SimpleLayout } from './layouts/SimpleLayout'
import { HomePage } from './components/HomePage'
import { ProjectView } from './components/projects/ProjectView'
import theme from './config/theme'

function App() {
  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <SimpleLayout>
          <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/projects/:projectId' element={<ProjectView />} />
            {/* Authentication routes will be added here */}
            {/* More project management routes will be added here */}
          </Routes>
        </SimpleLayout>
      </BrowserRouter>
    </ChakraProvider>
  )
}

export default App
