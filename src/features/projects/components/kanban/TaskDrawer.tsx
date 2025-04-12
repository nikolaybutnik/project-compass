import React, { useState } from 'react'
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  Input,
  FormLabel,
  FormControl,
  Select,
  Flex,
  Tag,
  TagLabel,
  TagCloseButton,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react'
import { KanbanTask, TaskPriority } from '@/shared/types'

interface TaskDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (taskFormData: Partial<KanbanTask>) => void
  columnTitle?: string
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  columnTitle,
}) => {
  const initTaskForm: Partial<KanbanTask> = {
    title: '',
    description: '',
    priority: '' as TaskPriority,
    tags: [],
  }

  const [formData, setFormData] = useState<Partial<KanbanTask>>(initTaskForm)
  const [tagInput, setTagInput] = useState('')

  const handleSubmit = () => {
    onSubmit(formData)
    setFormData(initTaskForm)
    setTagInput('')
    onClose()
  }

  const handleAddTag = () => {
    if (tagInput?.trim()) {
      const trimmedTag = tagInput?.trim()
      if (!formData?.tags?.includes(trimmedTag)) {
        setFormData({
          ...formData,
          tags: [...(formData?.tags || []), trimmedTag],
        })
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (indexToRemove: number) => {
    setFormData({
      ...formData,
      tags: formData?.tags?.filter((_, i) => i !== indexToRemove) || [],
    })
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement='right' size='md'>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          Create a New Task {columnTitle ? `in ${columnTitle}` : ''}
        </DrawerHeader>
        <DrawerBody>
          <FormControl mb={4} isRequired>
            <FormLabel>Title</FormLabel>
            <Input
              value={formData?.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e?.target?.value })
              }
              placeholder='Title'
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Description</FormLabel>
            <Input
              value={formData?.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e?.target?.value })
              }
              placeholder='Description'
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Priority</FormLabel>
            <Select
              value={formData.priority || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as TaskPriority,
                })
              }
              placeholder='Select priority'
            >
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.URGENT}>Urgent</option>
            </Select>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Tags</FormLabel>
            <Flex direction='column'>
              <InputGroup size='md'>
                <Input
                  placeholder='Add a tag'
                  value={tagInput}
                  onChange={(e) => setTagInput(e?.target?.value)}
                  onKeyDown={(e) => {
                    if (e?.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  pr='4.5rem'
                />
                <InputRightElement width='4.5rem'>
                  <Button
                    h='1.75rem'
                    size='sm'
                    onClick={handleAddTag}
                    isDisabled={!tagInput?.trim()}
                  >
                    Add
                  </Button>
                </InputRightElement>
              </InputGroup>
              {formData?.tags && formData?.tags?.length > 0 && (
                <Flex mt={2} flexWrap='wrap' gap={2}>
                  {formData?.tags?.map((tag, i) => (
                    <Tag key={i} size='md' colorScheme='blue'>
                      <TagLabel>{tag}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveTag(i)} />
                    </Tag>
                  ))}
                </Flex>
              )}
            </Flex>
          </FormControl>
        </DrawerBody>

        <DrawerFooter>
          <Button variant='outline' mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme='blue'
            onClick={handleSubmit}
            isDisabled={!formData.title?.trim()}
          >
            Save
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
