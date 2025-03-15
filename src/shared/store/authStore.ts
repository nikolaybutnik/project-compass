import { useEffect } from 'react'
import { create } from 'zustand'
import { User as AppUser } from '@/shared/types'
import { User as FirebaseUser } from 'firebase/auth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createOrUpdateUser } from '@/features/users/services/usersService'
import {
  signOutUser,
  subscribeToAuthState,
} from '@/features/auth/services/authService'
import { USERS_QUERY_KEYS, useUsersStore } from '@/shared/store/usersStore'

export const AUTH_QUERY_KEYS = {
  AUTH_STATE: 'authState',
}

interface AuthState {
  firebaseUser: FirebaseUser | null
  isAuthLoading: boolean
  isProfileLoading: boolean
  error: Error | null

  signOut: () => Promise<void>
  setFirebaseUser: (firebaseUser: FirebaseUser | null) => void
  setIsAuthLoading: (isAuthLoading: boolean) => void
  setIsProfileLoading: (isProfileLoading: boolean) => void
  setError: (error: Error | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  isAuthLoading: true,
  isProfileLoading: false,
  error: null,

  signOut: async () => {
    try {
      await signOutUser()
      set({ firebaseUser: null })
      useUsersStore.getState().setCurrentUser(null)
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Unknown error'),
      })
    }
  },

  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setIsAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
  setIsProfileLoading: (isProfileLoading) => set({ isProfileLoading }),
  setError: (error) => set({ error }),
}))

// Init auth and sync with Firebase
export const useInitAuth = () => {
  const queryClient = useQueryClient()
  const { setFirebaseUser, setIsAuthLoading, setIsProfileLoading, setError } =
    useAuthStore.getState()
  const { setCurrentUser } = useUsersStore.getState()

  const createOrUpdateUserMutation = useMutation({
    mutationFn: (firebaseUser: FirebaseUser) =>
      createOrUpdateUser(firebaseUser),
    onSuccess: (user) => {
      queryClient.setQueryData([USERS_QUERY_KEYS.USER_PROFILE, user?.id], user)
      setCurrentUser(user)
      setIsProfileLoading(false)
    },
    onError: (error) => {
      setError(
        error instanceof Error
          ? error
          : new Error('Failed to load user profile')
      )
      setIsProfileLoading(false)
    },
  })

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((firebaseUser) => {
      setFirebaseUser(firebaseUser)
      setIsAuthLoading(false)

      if (firebaseUser) {
        setIsProfileLoading(true)
        createOrUpdateUserMutation.mutate(firebaseUser)
      } else {
        setCurrentUser(null)
        setIsProfileLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  return useAuthStore()
}

// Hook for use with components
export const useAuth = () => {
  const { firebaseUser, isAuthLoading, isProfileLoading, error, signOut } =
    useAuthStore()
  const { currentUser } = useUsersStore()
  const loading = isAuthLoading || isProfileLoading

  return {
    user: currentUser,
    firebaseUser,
    loading,
    error,
    signOut,
  }
}
