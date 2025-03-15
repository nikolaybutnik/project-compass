import { create } from 'zustand'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User as AppUser } from '@/shared/types'
import { updateActiveProjectId } from '@/features/users/services/usersService'

export const USERS_QUERY_KEYS = {
  USER_PROFILE: 'userProfile',
}

interface UsersState {
  currentUser: AppUser | null
  setCurrentUser: (user: AppUser | null) => void
}

export const useUsersStore = create<UsersState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
}))

export const useSetActiveProjectMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      projectId,
    }: {
      userId: string
      projectId: string
    }) => {
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const updatedUser = await updateActiveProjectId(userId, projectId)
      return updatedUser
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(
        [USERS_QUERY_KEYS.USER_PROFILE, updatedUser?.id],
        updatedUser
      )
      useUsersStore.getState().setCurrentUser(updatedUser)
    },
  })
}

// Hook for components
export const useCurrentUser = () => {
  const { currentUser } = useUsersStore()
  return { currentUser }
}
