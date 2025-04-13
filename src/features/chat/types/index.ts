import { MessageRole } from '@/features/ai/types'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
}
