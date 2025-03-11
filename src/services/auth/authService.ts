import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  UserCredential,
  User,
} from 'firebase/auth'
import { app } from '@/config/firebase'

const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

export const loginWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password)
}

export const loginWithGoogle = async (): Promise<UserCredential> => {
  return signInWithPopup(auth, googleProvider)
}

export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password)
}

export const logout = async (): Promise<void> => {
  return signOut(auth)
}

export const resetPassword = async (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email)
}

export const getCurrentUser = (): User | null => {
  return auth.currentUser
}

export const onAuthStateChanged = (
  callback: (user: User | null) => void
): (() => void) => {
  return auth.onAuthStateChanged(callback)
}
