"use client"

import { useMemo } from "react"
import { subscribeToDailySales } from "@/lib/firestore"
import { useFirestoreCollection } from "./use-firestore-collection"
import type { DailySales } from "@/types"

export function useDailySales() {
  const subscribe = useMemo(
    () => (onData: (data: DailySales[]) => void) => {
      return subscribeToDailySales(onData)
    },
    [],
  )

  return useFirestoreCollection<DailySales>({ subscribe })
}
