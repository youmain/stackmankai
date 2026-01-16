/**
 * usePlayerLinking
 * 
 * カスタムフック: プレイヤー紐づけロジックを管理します。
 * 
 * 機能：
 * 1. プレイヤーの照合（uniqueId、Firestore ID、名前）
 * 2. 紐づけ成功時の customerAccount 更新
 * 3. storeId と playerName の自動更新
 * 
 * リファクタリング: app/customer-view/page.tsx の linkedPlayer useMemo と
 * 関連する useEffect から分離しました。
 */

import { useState, useEffect, useMemo } from "react"
import { updateCustomerAccount } from "@/lib/firestore"
import type { Player, CustomerAccount } from "@/types"

interface UsePlayerLinkingReturn {
  linkedPlayer: Player | undefined
  isUpdating: boolean
  linkingError: string | null
}

export const usePlayerLinking = (
  players: Player[],
  customerAccount: CustomerAccount | null
): UsePlayerLinkingReturn => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [linkingError, setLinkingError] = useState<string | null>(null)

  // linkedPlayerを早期に定義（useMemoで最適化）
  const linkedPlayer = useMemo(() => {
    return players.find((player) => {
      if (!customerAccount?.playerId) return false

      console.log("[v0] プレイヤー照合チェック:", {
        customerPlayerId: customerAccount?.playerId,
        playerUniqueId: player.uniqueId,
        playerId: player.id,
        playerName: player.name,
        pokerName: player.pokerName,
      })

      const matchConditions = [
        // 1. uniqueIdで照合（数値IDが生成されている場合）
        player.uniqueId && player.uniqueId === customerAccount?.playerId,

        // 2. Firestore IDで照合
        player.id === customerAccount?.playerId,

        // 3. 名前で照合（フォールバック）
        player.name === customerAccount?.playerName,
        player.pokerName === customerAccount?.playerName,
      ]

      const isMatch = matchConditions.some((condition) => condition)

      if (isMatch) {
        console.log("[v0] プレイヤー照合成功:", {
          playerId: player.id,
          playerName: player.name,
          pokerName: player.pokerName,
          storeName: player.storeName,
          storeId: player.storeId,
        })
      }

      return isMatch
    })
  }, [players, customerAccount?.playerId, customerAccount?.playerName])

  // linkedPlayerが見つかった時にstoreIdを自動更新
  useEffect(() => {
    console.log("[v0] === useEffect triggered ===")
    console.log(
      "[v0] linkedPlayer:",
      linkedPlayer
        ? {
            id: linkedPlayer.id,
            name: linkedPlayer.name,
            uniqueId: linkedPlayer.uniqueId,
            storeId: linkedPlayer.storeId,
            storeName: linkedPlayer.storeName,
          }
        : "NOT FOUND"
    )
    console.log(
      "[v0] customerAccount:",
      customerAccount
        ? {
            id: customerAccount.id,
            playerId: customerAccount.playerId,
            playerName: customerAccount.playerName,
            storeId: customerAccount.storeId,
          }
        : "NOT FOUND"
    )

    const updateStoreIdIfNeeded = async () => {
      if (linkedPlayer && customerAccount) {
        // storeIdまたはplayerNameが未設定または不正な場合に更新
        const hasInvalidPlayerName =
          customerAccount.playerName?.startsWith("プレイヤー") ||
          !customerAccount.playerName
        const needsUpdate = !customerAccount.storeId || hasInvalidPlayerName

        if (needsUpdate && linkedPlayer.storeId) {
          console.log("[v0] Updating customerAccount with player info:", {
            storeId: linkedPlayer.storeId,
            playerName: linkedPlayer.name || linkedPlayer.pokerName,
          })
          try {
            setIsUpdating(true)
            setLinkingError(null)

            await updateCustomerAccount(customerAccount.id, {
              storeId: linkedPlayer.storeId,
              playerName: linkedPlayer.name || linkedPlayer.pokerName,
            })

            console.log("[v0] Customer account updated successfully")
          } catch (error) {
            console.error("[v0] Error updating customer account:", error)
            setLinkingError(
              error instanceof Error ? error.message : "更新に失敗しました"
            )
          } finally {
            setIsUpdating(false)
          }
        }
      }
    }

    updateStoreIdIfNeeded()
  }, [linkedPlayer, customerAccount])

  return {
    linkedPlayer,
    isUpdating,
    linkingError,
  }
}
