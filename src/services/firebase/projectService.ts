import { db } from '@/config/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { Project } from '../../types'

const COLLECTION = 'projects'

export const createProject = async (project: Omit<Project, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...project,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return { id: docRef.id, ...project }
  } catch (error) {
    console.error('Error creating project:', error)
    throw error
  }
}
