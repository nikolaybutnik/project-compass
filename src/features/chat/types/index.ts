import { MessageRole } from '@/features/ai/types'

export interface ChatMessage {
  role: MessageRole
  content: string
  timestamp: Date
}
