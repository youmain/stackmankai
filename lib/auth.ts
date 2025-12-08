import {
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { auth } from "./firebase"

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    console.error("ログインエラー:", error)
    throw error
  }
}

export const signInAnonymous = async () => {
  try {
    const userCredential = await signInAnonymously(auth)
    return userCredential.user
  } catch (error) {
    console.error("匿名ログインエラー:", error)
    throw error
  }
}

export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error("ログアウトエラー:", error)
    throw error
  }
}

export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}
