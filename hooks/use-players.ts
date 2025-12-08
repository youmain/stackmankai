"use client"

import { useMemo } from "react"
import { subscribeToPlayers } from "@/lib/firestore"
import { useFirestoreCollection } from "./use-firestore-collection"
import type { Player } from "@/types"

export function usePlayers() {
  const subscribe = useMemo(
    () => (onData: (data: Player[]) => void, onError: (error: Error) => void) => {
      return subscribeToPlayers(onData, onError)
    },
    [],
  )

  return useFirestoreCollection<Player>({ subscribe })
}
