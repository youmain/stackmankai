"use client"

import { useMemo } from "react"
import { subscribeToRakeHistory } from "@/lib/firestore"
import { useFirestoreCollection } from "./use-firestore-collection"
import type { RakeHistory } from "@/types"

export function useRakeHistory() {
  const subscribe = useMemo(
    () => (onData: (data: RakeHistory[]) => void, onError: (error: Error) => void) => {
      return subscribeToRakeHistory(onData, onError)
    },
    [],
  )

  return useFirestoreCollection<RakeHistory>({ subscribe })
}
