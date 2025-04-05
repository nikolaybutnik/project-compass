import { useEffect } from 'react'
import { QueryCacheNotifyEvent, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/shared/store/projectsStore'

// Hook that listens for project data changes and triggers a callback
export const useContextSync = (
  projectId: string | undefined,
  onProjectUpdated: () => void
) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!projectId) return

    const handleQueryCacheChange = (event: QueryCacheNotifyEvent) => {
      if (event.type !== 'updated') {
        return
      }

      if (
        event.action?.type === 'invalidate' &&
        Array.isArray(event.query.queryKey) &&
        event.query.queryKey[0] === QUERY_KEYS.PROJECT &&
        event.query.queryKey[1] === projectId
      ) {
        onProjectUpdated()
      }
    }

    const unsubscribe = queryClient
      .getQueryCache()
      .subscribe(handleQueryCacheChange)

    return () => {
      unsubscribe()
    }
  }, [projectId, onProjectUpdated, queryClient])
}
