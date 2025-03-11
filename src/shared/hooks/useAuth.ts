import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { auth } from '@/features/auth/services/authService'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, authLoading }
}
