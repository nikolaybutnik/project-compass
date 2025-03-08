import React from 'react'
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import { KanbanBoard } from '../kanban/KanbanBoard'

export const ProjectView = () => {
  const { projectId } = useParams()

  return (
    <Box>
      <Heading mb={6}>Project Management</Heading>

      <Tabs colorScheme='blue' variant='enclosed' isLazy>
        <TabList>
          <Tab>Kanban Board</Tab>
          <Tab>Overview</Tab>
          <Tab>AI Insights</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <KanbanBoard />
          </TabPanel>
          <TabPanel>
            <Box p={4}>Project overview and details will go here</Box>
          </TabPanel>
          <TabPanel>
            <Box p={4}>AI suggestions and insights will go here</Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}
