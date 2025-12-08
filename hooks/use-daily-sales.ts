"use client"

import { useMemo } from "react"
import { subscribeToDailySales } from "@/lib/firestore"
import { useFirestoreCollection } from "./use-firestore-collection"
import type { DailySales } from "@/types"

export function useDailySales() {
  const subscribe = useMemo(
    () => (onData: (data: DailySales[]) => void, onError: (error: Error) => void) => {
      return subscribeToDailySales(onData, onError)
    },
    [],
  )

  return useFirestoreCollection<DailySales>({ subscribe })
}
