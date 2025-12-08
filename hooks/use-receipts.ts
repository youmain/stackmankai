"use client"

import { useMemo } from "react"
import { subscribeToReceipts } from "@/lib/firestore"
import { useFirestoreCollection } from "./use-firestore-collection"
import type { Receipt } from "@/types"

export function useReceipts() {
  const subscribe = useMemo(
    () => (onData: (data: Receipt[]) => void, onError: (error: Error) => void) => {
      return subscribeToReceipts(onData, onError)
    },
    [],
  )

  return useFirestoreCollection<Receipt>({ subscribe })
}
