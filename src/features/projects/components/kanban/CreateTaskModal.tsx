import React, { useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  FormLabel,
  FormControl,
  Select,
} from '@chakra-ui/react'
import { KanbanTask, TaskPriority } from '@/shared/types'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (taskFormData: Partial<KanbanTask>) => void
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const initTaskForm: Partial<KanbanTask> = {
    title: '',
    description: '',
    priority: undefined,
    tags: [],
  }

  const [formData, setFormData] = useState(initTaskForm)

  const handleSubmit = () => {
    onSubmit(formData)
    setFormData(initTaskForm)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create a New Task</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
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
          <Input
            mb={4}
            onChange={(e) =>
              setFormData({ ...formData, description: e?.target?.value })
            }
            placeholder='Description'
          ></Input>
          <FormControl mb={4}>
            <FormLabel>Priority</FormLabel>
            <Select
              value={formData?.priority}
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
        </ModalBody>
        <ModalFooter>
          <Button colorScheme='blue' mr={3} onClick={handleSubmit}>
            Save
          </Button>
          <Button variant='ghost' onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
