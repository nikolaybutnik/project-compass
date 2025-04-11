import React from 'react'
import {
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'
import { KanbanColumn as KanbanColumnType } from '@/shared/types'
import { FaPlus } from 'react-icons/fa'

interface KanbanColumnProps {
  column: KanbanColumnType
  isDragging: boolean
  onAddTask: (columnId: string) => void
  children: React.ReactNode
}

export const KanbanColumn: React.FC<KanbanColumnProps> = React.memo(
  ({
    column,
    isDragging = false,
    onAddTask,
    children,
  }: {
    column: KanbanColumnType
    isDragging: boolean
    onAddTask: (columnId: string) => void
    children: React.ReactNode
  }) => {
    const columnBg = useColorModeValue('gray.200', 'gray.700')
    const { setNodeRef, isOver } = useDroppable({
      id: `column-${column?.id}`,
    })
    const borderColor = isOver
      ? useColorModeValue('blue.500', 'blue.300')
      : useColorModeValue('gray.200', 'gray.600')

    return (
      <Box
        ref={setNodeRef}
        id={`column-${column?.id}`}
        bg={columnBg}
        p={4}
        borderRadius='md'
        borderWidth='1px'
        borderStyle={isOver ? 'dashed' : 'solid'}
        borderColor={borderColor}
        display='flex'
        flexDirection='column'
        h='100%'
        minH='300px'
        transition='all 0.2s'
      >
        <HStack justify='space-between' mb={4} h='40px'>
          <Heading size='md'>{column?.title}</Heading>
          {(column?.tasks?.length || 0) > 4 && (
            <Button
              variant='outline'
              borderStyle='dashed'
              borderColor='gray.400'
              color='gray.500'
              transition='all 0.2s'
              opacity={isDragging ? 0 : 1}
              pointerEvents={isDragging ? 'none' : 'auto'}
              h='100%'
              _hover={{
                borderColor: useColorModeValue('blue.400', 'blue.300'),
                bg: 'transparent',
              }}
              onClick={() => onAddTask(column?.id)}
            >
              <Icon as={FaPlus} />
            </Button>
          )}
        </HStack>

        <VStack
          spacing={4}
          align='stretch'
          flex='1'
          overflow='auto'
          sx={{
            '& > *': {
              transition: 'transform 0.2s, opacity 0.2s',
            },
          }}
        >
          {children}

          <Box
            p={4}
            borderRadius='md'
            borderWidth='1px'
            borderStyle='dashed'
            borderColor='gray.400'
            boxShadow='sm'
            cursor='pointer'
            _hover={{
              boxShadow: 'md',
              borderColor: useColorModeValue('blue.400', 'blue.300'),
              bg: 'transparent',
            }}
            transition='all 0.2s'
            display='flex'
            alignItems='center'
            justifyContent='center'
            minH='80px'
            opacity={isDragging ? 0 : 1}
            pointerEvents={isDragging ? 'none' : 'auto'}
            onClick={() => onAddTask(column?.id)}
          >
            <Icon as={FaPlus} color='gray.500' />
          </Box>
        </VStack>
      </Box>
    )
  }
)
