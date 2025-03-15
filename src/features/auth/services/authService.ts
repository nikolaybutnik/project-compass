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
  onAuthStateChanged,
} from 'firebase/auth'
import { app } from '@/shared/config/firebase'

// Initialize Firebase Auth
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password)
}

export const signInWithGoogle = async (): Promise<UserCredential> => {
  return signInWithPopup(auth, googleProvider)
}

export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password)
}

export const signOutUser = async (): Promise<void> => {
  return signOut(auth)
}

export const resetPassword = async (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email)
}

export const subscribeToAuthState = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback)
}
