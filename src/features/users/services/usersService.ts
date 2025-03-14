import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { User as FirebaseUser } from 'firebase/auth'
import { db } from '@/shared/config/firebase'
import { User as AppUser } from '@/shared/types'
import { COLLECTIONS } from '@/shared/constants'
import { UserDto } from '@/shared/types/dto'

const createUserData = (firebaseUser: FirebaseUser): UserDto => ({
  id: firebaseUser.uid,
  email: firebaseUser.email,
  displayName:
    firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
  photoURL: firebaseUser.photoURL,
  activeProjectId: null,
  role: 'user',
  lastLogin: serverTimestamp(),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  preferences: {
    theme: 'light',
    language: 'en',
  },
})

export const createOrUpdateUser = async (
  firebaseUser: FirebaseUser
): Promise<AppUser> => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      // New user - create full profile
      const newUserData = createUserData(firebaseUser)
      await setDoc(userRef, newUserData)
    } else {
      // Existing user - only update necessary fields
      const userData = userSnap?.data() as AppUser
      const updatedFields: Record<string, any> = {
        lastLogin: serverTimestamp(),
      }

      if (userData?.email !== firebaseUser?.email)
        updatedFields.email = firebaseUser?.email
      if (
        firebaseUser?.displayName &&
        userData?.displayName !== firebaseUser?.displayName
      )
        updatedFields.displayName = firebaseUser?.displayName
      if (userData?.photoURL !== firebaseUser?.photoURL)
        updatedFields.photoURL = firebaseUser?.photoURL

      if (Object.keys(updatedFields).length > 1)
        updatedFields.updatedAt = serverTimestamp()

      await updateDoc(userRef, updatedFields)
    }

    const updatedDoc = await getDoc(userRef)
    if (!updatedDoc?.exists()) {
      throw new Error('Failed to fetch user data after update')
    }

    return updatedDoc?.data() as AppUser
  } catch (error) {
    console.error('Error creating/updating user:', error)
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
