"use client"

import { useState, useEffect } from "react"

export interface UseFirestoreCollectionOptions<T> {
  subscribe: (onData: (data: T[]) => void, onError: (error: Error) => void) => () => void
}

export interface UseFirestoreCollectionReturn<T> {
  data: T[]
  loading: boolean
  error: Error | null
}

export function useFirestoreCollection<T>({
  subscribe,
}: UseFirestoreCollectionOptions<T>): UseFirestoreCollectionReturn<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const unsubscribe = subscribe(
      (newData) => {
        setData(newData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [subscribe])

  return { data, loading, error }
}
