"use client"

import { useMemo, useEffect } from "react"
import { updateCustomerAccount, updatePlayer } from "@/lib/firestore"
import { doc, getDoc } from "firebase/firestore"
import { getDb } from "@/lib/firebase"
import type { Player, CustomerAccount } from "@/types"

interface UseCustomerLogicProps {
  players: Player[]
  customerAccount: CustomerAccount | null
  setCustomerAccount: (account: CustomerAccount | null) => void
}

interface UseCustomerLogicReturn {
  linkedPlayer: Player | null
  getDisplayName: (player: Player) => string
  getPlayerName: (player: any) => string
}

export const useCustomerLogic = ({
  players,
  customerAccount,
  setCustomerAccount,
}: UseCustomerLogicProps): UseCustomerLogicReturn => {

  const getDisplayName = (player: any) => {
    if (!player) return "不明なプレイヤー";
    return player.pokerName || player.name || `プレイヤー${player.id || player.uniqueId || ""}`
  }

  const getPlayerName = (player: any): string => {
    if (!player) return "プレイヤー"
    if (typeof player === "string") return player
    if (typeof player === "object") {
      return player.pokerName || player.name || "プレイヤー"
    }
    return "プレイヤー"
  }

  // linkedPlayerを早期に定義（useMemoで最適化）
  const linkedPlayer = useMemo((): Player | null => {
    if (!players || !Array.isArray(players)) {
      console.warn("[useCustomerLogic] players is not an array:", players)
      return null
    }
    const found = (players || []).find((player) => {
      if (!customerAccount?.playerId) return false

      // console.log("[v0] プレイヤー照合チェック:", {
      //   customerPlayerId: customerAccount?.playerId,
      //   playerUniqueId: player.uniqueId,
      //   playerId: player.id,
      //   playerName: player.name,
      //   pokerName: player.pokerName,
      // })

      const matchConditions = [
        // 1. uniqueIdで照合（数値IDが生成されている場合）
        player.uniqueId && player.uniqueId === customerAccount?.playerId,

        // 2. Firestore IDで照合
        player.id === customerAccount?.playerId,

        // 3. Firebase UIDで照合 (認証情報との紐づけ)
        player.firebaseUid === customerAccount?.playerId,

        // 4. 名前で照合（フォールバック）
        player.name === customerAccount?.playerName,
        player.pokerName === customerAccount?.playerName,
      ]

      const isMatch = matchConditions.some((condition) => condition)

      // if (isMatch) {
      //   console.log("[v0] プレイヤー照合成功:", {
      //     playerId: player.id,
      //     playerName: player.name,
      //     pokerName: player.pokerName,
      //     storeName: player.storeName,
      //     storeId: player.storeId,
      //   })
      // }

      return isMatch
    })
    return found || null
  }, [players, customerAccount?.playerId, customerAccount?.playerName])

  // linkedPlayerが見つかった時にstoreIdを自動更新
  useEffect(() => {
    const updateStoreIdIfNeeded = async () => {
      if (linkedPlayer && customerAccount) {
        // storeIdまたはplayerNameが未設定または不正な場合に更新
        const hasInvalidPlayerName = customerAccount.playerName?.startsWith("プレイヤー") || !customerAccount.playerName
        const needsUpdate = !customerAccount.storeId || hasInvalidPlayerName
        
        if (needsUpdate && linkedPlayer.storeId) {
          try {
            const playerName = linkedPlayer.name || linkedPlayer.pokerName || `プレイヤー${linkedPlayer.uniqueId}`
            await updateCustomerAccount(customerAccount.id, {
              storeId: linkedPlayer.storeId,
              storeName: linkedPlayer.storeName || "未設定",
              playerName: playerName,
            })
            // Update local customerAccount state
            setCustomerAccount({
              ...customerAccount,
              storeId: linkedPlayer.storeId,
              storeName: linkedPlayer.storeName || "未設定",
              playerName: playerName,
            })
          } catch (error) {
            console.error("[useCustomerLogic] Error updating customerAccount:", error)
          }
        }
        
        // プレイヤーのstoreNameが未設定の場合、店舗情報から取得して更新
        if (linkedPlayer.storeId && (!linkedPlayer.storeName || linkedPlayer.storeName === "未設定" || linkedPlayer.storeName === "")) {
          try {
            const db = getDb()
            if (db) {
              const storeDocRef = doc(db, "stores", linkedPlayer.storeId)
              const storeDoc = await getDoc(storeDocRef)
              
              if (storeDoc.exists()) {
                const storeData = storeDoc.data()
                const storeName = storeData.storeName || "未設定"
                await updatePlayer(linkedPlayer.id, { storeName })
              }
            }
          } catch (error) {
            console.error("[useCustomerLogic] Error updating player storeName:", error)
          }
        }
      }
    }
    updateStoreIdIfNeeded()
  }, [linkedPlayer?.id, linkedPlayer?.storeId, linkedPlayer?.storeName, customerAccount?.id, customerAccount?.storeId, customerAccount?.playerName])

  return {
    linkedPlayer,
    getDisplayName,
    getPlayerName,
  }
}
