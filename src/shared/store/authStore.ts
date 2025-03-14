import { useEffect } from 'react'
import { create } from 'zustand'
import { User as AppUser } from '@/shared/types'
import { User as FirebaseUser } from 'firebase/auth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createOrUpdateUser } from '@/features/users/services/usersService'
import { auth } from '@/features/auth/services/authService'

export const AUTH_QUERY_KEYS = {
  USER: 'user',
}

interface AuthState {
  user: AppUser | null
  firebaseUser: FirebaseUser | null
  isAuthLoading: boolean
  isProfileLoading: boolean
  error: Error | null

  signOut: () => Promise<void>

  setUser: (user: AppUser | null) => void
  setFirebaseUser: (firebaseUser: FirebaseUser | null) => void
  setIsAuthLoading: (isAuthLoading: boolean) => void
  setIsProfileLoading: (isProfileLoading: boolean) => void
  setError: (error: Error | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  isAuthLoading: true,
  isProfileLoading: false,
  error: null,

  signOut: async () => {
    try {
      await auth.signOut()
    } catch (error) {
      set({
        error: error instanceof Error ? error : new Error('Unknown error'),
      })
    }
  },

  setUser: (user) => set({ user }),
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setIsAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
  setIsProfileLoading: (isProfileLoading) => set({ isProfileLoading }),
  setError: (error) => set({ error }),
}))

// Init auth and sync with Firebase
export const useInitAuth = () => {
  const queryClient = useQueryClient()
  const {
    setUser,
    setFirebaseUser,
    setIsAuthLoading,
    setIsProfileLoading,
    setError,
  } = useAuthStore.getState()

  const createOrUpdateUserMutation = useMutation({
    mutationFn: (firebaseUser: FirebaseUser) =>
      createOrUpdateUser(firebaseUser),
    onSuccess: (user) => {
      queryClient.setQueryData([AUTH_QUERY_KEYS.USER, user?.id], user)
      setUser(user)
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
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      setIsAuthLoading(false)

      if (firebaseUser) {
        setIsProfileLoading(true)
        createOrUpdateUserMutation.mutate(firebaseUser)
      } else {
        setUser(null)
        setIsProfileLoading(false)
      }

      return () => unsubscribe()
    })
  }, [])

  return useAuthStore()
}

// Hook for use with components
export const useAuth = () => {
  const { user, isAuthLoading, isProfileLoading, error, signOut } =
    useAuthStore()
  const loading = isAuthLoading || isProfileLoading

  return { user, loading, error, signOut }
}
