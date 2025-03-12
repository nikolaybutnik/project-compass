import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { User as FirebaseUser } from 'firebase/auth'
import { db } from '@/shared/config/firebase'
import { User } from '@/shared/types'
import { COLLECTIONS } from '@/shared/constants'

const createUserData = (firebaseUser: FirebaseUser) => ({
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
): Promise<User> => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      // New user - create full profile
      const newUserData = createUserData(firebaseUser)
      await setDoc(userRef, newUserData)
    } else {
      // Existing user - only update necessary fields
      const userData = userSnap.data() as User
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
    if (!updatedDoc.exists()) {
      throw new Error('Failed to fetch user data after update')
    }

    return updatedDoc.data() as User
  } catch (error) {
    console.error('Error creating/updating user:', error)
    throw error
  }
}
