import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { User as FirebaseUser } from 'firebase/auth'
import { db } from '@/shared/config/firebase'
import { User as AppUser } from '@/shared/types'
import { COLLECTIONS } from '@/shared/constants'
import { UserDto } from '@/shared/types/dto'
import apiClient from '@/shared/api/apiClient'

export const createOrUpdateUser = async (
  firebaseUser: FirebaseUser
): Promise<AppUser | null> => {
  if (!firebaseUser) return null

  try {
    const userData: UserDto = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || '',
    }

    const response = await apiClient.post('/api/firebase/users', userData)

    return (response.data as AppUser) || null
  } catch (error) {
    console.error('Error syncing user data:', error)
    throw error
  }
}

export const getUser = async (
  userId: string | null
): Promise<AppUser | null> => {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap?.exists()) {
      return null
    }

    return userSnap?.data() as AppUser
  } catch (error) {
    console.error('Error fetching user:', error)
    throw error
  }
}

export const updateActiveProjectId = async (
  userId: string,
  projectId: string
): Promise<AppUser> => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      throw new Error('User not found')
    }

    const userData = userSnap?.data() as AppUser
    const updatedUser = {
      ...userData,
      activeProjectId: projectId,
      updatedAt: serverTimestamp(),
    }

    await updateDoc(userRef, updatedUser)

    const updatedDoc = await getDoc(userRef)
    return updatedDoc?.data() as AppUser
  } catch (error) {
    console.error('Error updating active project ID:', error)
    throw error
  }
}
