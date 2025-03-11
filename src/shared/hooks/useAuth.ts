import { useState, useEffect } from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import { auth } from '@/features/auth/services/authService'
import { createOrUpdateUser } from '@/features/users/services/usersService'
import { User as AppUser } from '@/shared/types'

export const useAuth = () => {
  const [_, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser)
      setAuthLoading(false)

      if (fbUser) {
        setProfileLoading(true)

        try {
          if (!user) {
            const userProfile = await createOrUpdateUser(fbUser)
            setUser(userProfile)
          }
        } catch (error) {
          console.error('Error setting up user profile:', error)
        } finally {
          setProfileLoading(false)
        }
      } else {
        setUser(null)
        setProfileLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const loading = authLoading || profileLoading

  return { user, loading }
}
