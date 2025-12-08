"use client"

import { useState, useEffect } from "react"
import { subscribeToPlayerPurchaseHistory } from "@/lib/firestore"

export function usePlayerPurchaseHistory() {
  const [data, setData] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToPlayerPurchaseHistory(
      (history) => {
        setData(history)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  return { data, loading, error }
}
