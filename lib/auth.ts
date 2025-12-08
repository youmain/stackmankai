import {
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { auth } from "./firebase"

export const signIn = async (email: string, password: string) => {
  if (!auth) throw new Error("Auth not initialized")
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    console.error("ログインエラー:", error)
    throw error
  }
}

export const signInAnonymous = async () => {
  if (!auth) throw new Error("Auth not initialized")
  try {
    const userCredential = await signInAnonymously(auth)
    return userCredential.user
  } catch (error) {
    console.error("匿名ログインエラー:", error)
    throw error
  }
}

export const signOut = async () => {
  if (!auth) throw new Error("Auth not initialized")
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error("ログアウトエラー:", error)
    throw error
  }
}

export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  if (!auth) throw new Error("Auth not initialized")
  return onAuthStateChanged(auth, callback)
}
