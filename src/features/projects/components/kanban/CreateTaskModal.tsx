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
} from '@chakra-ui/react'
import { KanbanTask } from '@/shared/types'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (taskFormData: Partial<KanbanTask>) => void
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    tags: [],
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create a New Task</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel>Title</FormLabel>
            <Input onChange={(e) => {}} placeholder='Title' />
          </FormControl>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
