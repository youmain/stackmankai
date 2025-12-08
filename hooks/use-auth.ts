"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { createModuleLogger } from "@/lib/logger"

const log = createModuleLogger("Auth")

interface UseAuthReturn {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      setError("Auth not initialized")
      return
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        log.debug("Firebase Auth state changed:", user ? "authenticated" : "not authenticated")
        setUser(user)
        setLoading(false)
        setError(null)
      },
      (error) => {
        log.error("Firebase Auth error:", error)
        setError(error.message)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  return { user, loading, error }
}
