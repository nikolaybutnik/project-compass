import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAI } from '../context/aiContext'
import { Project } from '@/shared/types'
import { QUERY_KEYS } from '@/shared/store/projectsStore'

export const useAiContextSync = (projectId: string | undefined) => {
  // TODO: Implement AI context sync each time the project is updated
}
