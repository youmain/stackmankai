"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Trash2, Settings } from "lucide-react"
import {
  subscribeToPlayers,
  deletePlayer,
  createGame,
  addPlayerToGame,
  updateGameParticipantStack,
  endGameWithFinalStacks,
  subscribeToPlayerPurchaseHistory,
  subscribeToRakeHistory,
  togglePlayerStatus, // 新しい関数をインポート
  createReceipt, // 伝票作成関数をインポート
  updatePlayer, // Added updatePlayer import for ID generation
  addPlayer, // Added addPlayer import for JSON import functionality
  deleteAllPlayers, // 全プレイヤー削除関数をインポート
} from "@/lib/firestore"
import type { Player } from "@/types"
import { PlayerRegistrationModal } from "@/components/player-registration-modal"
import { BalanceManagementModal } from "@/components/balance-management-modal"
import { TransactionHistoryModal } from "@/components/transaction-history-modal"
import { GameStartModal } from "@/components/game-start-modal"
import { GameManagementModal } from "@/components/game-management-modal"
import { PasswordModal } from "@/components/password-modal"
import { PasswordSettingsModal } from "@/components/password-settings-modal"
import { PlayerStatusModal } from "@/components/player-status-modal" // PlayerStatusModalのインポートを追加
import { PlayerEditModal } from "@/components/player-edit-modal" // Added player edit modal import
import { SimpleBulkImport } from "@/components/simple-bulk-import" // SimpleBulkImportコンポーネントをインポート
import { PlayerCard } from "@/components/players/player-card"
import { PlayingPlayersCard } from "@/components/players/playing-players-card"
import { RakeSummaryCard } from "@/components/players/rake-summary-card"
import { useAuth } from "@/contexts/auth-context"
import { isFirebaseConfigured } from "@/lib/firebase"
import { handleError, handleSuccess } from "@/lib/error-handler"

export default function PlayersPage() {
  console.log("[v0] 📱 PlayersPageコンポーネント実行開始")

  const { userName } = useAuth()

  console.log("[v0] 🔐 認証状態確認:", { userName, hasUserName: !!userName })

  const [players, setPlayers] = useState<Player[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showGameStartModal, setShowGameStartModal] = useState(false)
  const [showGameManagementModal, setShowGameManagementModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showPasswordSettings, setShowPasswordSettings] = useState(false)
  const [showQRCodeModal, setShowQRCodeModal] = useState(false)
  const [showPlayerEditModal, setShowPlayerEditModal] = useState(false) // Added player edit modal state
  const [showJSONImportModal, setShowJSONImportModal] = useState(false) // Added JSON import modal state
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null)
  const [passwordAction, setPasswordAction] = useState<{
    type: "balance" | "delete" | "deleteAll"
    player?: Player
    callback: () => void
  } | null>(null)

  const [playerPurchaseHistory, setPlayerPurchaseHistory] = useState<Record<string, number>>({})
  const [rakeHistory, setRakeHistory] = useState<
    Array<{
      id: string
      playerId: string
      playerName: string
      gameId: string
      buyIn: number
      additionalStack: number
      finalStack: number
      rake: number
      createdAt: Date
    }>
  >([])

  const [showPlayerStatusModal, setShowPlayerStatusModal] = useState(false)
  const [statusChangePlayer, setStatusChangePlayer] = useState<Player | null>(null)
  const [firebaseError, setFirebaseError] = useState<string | null>(null)

  const getPlayerName = (player: any): string => {
    if (typeof player === "string") return player
    if (typeof player === "object" && player?.name) return player.name
    return "プレイヤー"
  }

  const generateNumericId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const handleGeneratePlayerId = async (player: Player) => {
    try {
      const newId = generateNumericId()
      await updatePlayer(player.id, { uniqueId: newId })
      console.log(`[v0] 🆔 プレイヤーID生成完了: ${player.name} -> ${newId}`)
      handleSuccess(`${player.name}のIDを生成しました: ${newId}`)
    } catch (error) {
      console.error(`[v0] ❌ プレイヤーID生成エラー (${player.name}):`, error)
      handleError(error, "プレイヤーID生成")
    }
  }

  const handleGenerateAllPlayerIds = async () => {
    const playersWithoutId = players.filter((p) => !p.uniqueId)
    if (playersWithoutId.length === 0) {
      handleSuccess("全てのプレイヤーに既にIDが設定されています")
      return
    }

    if (!confirm(`${playersWithoutId.length}人のプレイヤーにIDを生成しますか？`)) {
      return
    }

    try {
      for (const player of playersWithoutId) {
        const newId = generateNumericId()
        await updatePlayer(player.id, { uniqueId: newId })
        console.log(`[v0] 🆔 一括ID生成: ${player.name} -> ${newId}`)
      }
      handleSuccess(`${playersWithoutId.length}人のプレイヤーにIDを生成しました`)
    } catch (error) {
      console.error("[v0] ❌ 一括ID生成エラー:", error)
      handleError(error, "一括ID生成")
    }
  }

  const fetchPlayers = async () => {
    // Fetch players logic here
  }

  useEffect(() => {
    console.log("[v0] ===== useEffect実行開始 =====")
    console.log("[v0] プレイヤー管理画面マウント - リスナー初期化開始")
    console.log("[v0] 現在時刻:", new Date().toISOString())

    if (!isFirebaseConfigured()) {
      console.log("[v0] 🔥 Firebase設定不完全、リスナー初期化をスキップ")
      setFirebaseError("Firebase設定が不完全です。Project Settingsで環境変数を設定してください。")
      return
    }

    let unsubscribePlayers: (() => void) | null = null
    let unsubscribePurchaseHistory: (() => void) | null = null
    let unsubscribeRakeHistory: (() => void) | null = null

    try {
      // localStorageからstoreIdを取得
      const storeId = localStorage.getItem("storeId")
      console.log("[v0] プレイヤーリスナー開始", { storeId })
      
      unsubscribePlayers = subscribeToPlayers(
        (newPlayers) => {
          console.log("[v0] プレイヤーデータ受信:", {
            count: newPlayers.length,
            storeId,
            players: newPlayers.map((p) => ({
              id: p.id,
              name: p.name,
              balance: p.systemBalance,
              isPlaying: p.isPlaying,
              currentGameId: p.currentGameId,
              isSpecial: p.isSpecial,
              isDeduction: p.isDeduction,
              furigana: p.furigana,
              pokerName: p.pokerName,
              uniqueId: p.uniqueId,
            })),
          })
          setPlayers(newPlayers)
          setFirebaseError(null)
        },
        (error) => {
          console.error("[v0] プレイヤーリスナーエラー:", error)
          setFirebaseError("プレイヤーデータの読み込みに失敗しました。")
        },
        storeId, // storeIdを渡す
      )

      console.log("[v0] 購入金額履歴リスナー開始")
      unsubscribePurchaseHistory = subscribeToPlayerPurchaseHistory(
        (history) => {
          console.log("[v0] 💰 購入金額履歴同期受信:", Object.keys(history).length, "プレイヤー")
          setPlayerPurchaseHistory(history)
        }
      )

      console.log("[v0] レーキ履歴リスナー開始")
      unsubscribeRakeHistory = subscribeToRakeHistory(
        (history) => {
          console.log("[v0] 📊 レーキ履歴同期受信:", history.length, "件")
          console.log("[v0] 📊 レーキ履歴詳細データ:", {
            件数: history.length,
            レーキ履歴: history.map((game, index) => ({
              インデックス: index,
              プレイヤー名: game.playerName,
              プレイヤーID: game.playerId,
              ゲームID: game.gameId,
              バイイン: game.buyIn,
              追加スタック: game.additionalStack,
              最終スタック: game.finalStack,
              レーキ額: game.rake,
              計算式: `(${game.buyIn} + ${game.additionalStack}) - ${game.finalStack} = ${game.rake}`,
              作成日時: game.createdAt,
            })),
            合計レーキ: history.reduce((total, game) => total + game.rake, 0),
          })
          setRakeHistory(history)
        }
      )

      console.log("[v0] 全リスナー初期化完了")
    } catch (error) {
      console.error("[v0] リスナー初期化エラー:", error)
      setFirebaseError("データベース接続に失敗しました。")
    }

    return () => {
      console.log("[v0] リスナー停止開始")
      if (unsubscribePlayers) {
        console.log("[v0] プレイヤーリスナー停止")
        unsubscribePlayers()
      }
      if (unsubscribePurchaseHistory) {
        console.log("[v0] 購入金額履歴リスナー停止")
        unsubscribePurchaseHistory()
      }
      if (unsubscribeRakeHistory) {
        console.log("[v0] レーキ履歴リスナー停止")
        unsubscribeRakeHistory()
      }
      console.log("[v0] 全リスナー停止完了")
    }
  }, [])

  console.log("[v0] 🎯 プレイヤー管理画面レンダリング確認 - 現在時刻:", new Date().toISOString())

  console.log("[v0] PlayersPageコンポーネントレンダリング開始")

  const filteredPlayers = players
    .filter((player) => {
      const searchLower = searchTerm.toLowerCase()
      const playerName = typeof player.name === "string" ? player.name : (player.name as any)?.name || ""
      const nameMatch = playerName.toLowerCase().includes(searchLower)
      const furiganaMatch = player.furigana?.toLowerCase().includes(searchLower) || false
      const pokerNameMatch = player.pokerName?.toLowerCase().includes(searchLower) || false
      return nameMatch || furiganaMatch || pokerNameMatch
    })
    .sort((a, b) => {
      // プレイ中のプレイヤーを上に表示
      if (a.isPlaying && !b.isPlaying) return -1
      if (!a.isPlaying && b.isPlaying) return 1

      // プレイ中でない場合は名前順
      const aName = typeof a.name === "string" ? a.name : (a.name as any)?.name || ""
      const bName = typeof b.name === "string" ? b.name : (b.name as any)?.name || ""
      return aName.localeCompare(bName, "ja")
    })

  const handleBalanceManagement = (player: Player) => {
    setPasswordAction({
      type: "balance",
      player,
      callback: () => {
        setSelectedPlayer(player)
        setShowBalanceModal(true)
      },
    })
    setShowPasswordModal(true)
  }

  const handleDeletePlayer = async (player: Player) => {
    setPasswordAction({
      type: "delete",
      player,
      callback: async () => {
        if (!confirm(`${player.name}を削除しますか？この操作は取り消せません。`)) {
          return
        }

        setDeletingPlayerId(player.id)
        try {
          await deletePlayer(player.id)
          handleSuccess(`${player.name}を削除しました`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "削除に失敗しました"

          if (errorMessage.includes("アクティブなゲームに参加中")) {
            handleError(
              new Error(`${player.name}は現在ゲーム中のため削除できません。ゲームを終了してから削除してください。`),
              "プレイヤー削除",
            )
          } else {
            handleError(error, "プレイヤー削除")
          }

          console.error("[v0] プレイヤー削除エラー:", error)
        } finally {
          setDeletingPlayerId(null)
        }
      },
    })
    setShowPasswordModal(true)
  }

  const handleManageGame = (player: Player) => {
    setSelectedPlayer(player)
    setShowGameManagementModal(true)
  }

  const handleGameStart = async (gameData: {
    playerId: string
    playerName: string
    buyInAmount: number
    totalPurchase: number
    isActive: boolean
    createReceipt?: boolean // 伝票作成オプションを追加
  }) => {
    try {
      console.log("[v0] 🎮 ゲーム開始操作:", {
        操作者: userName,
        プレイヤー: gameData.playerName,
        バイイン額: gameData.buyInAmount,
        伝票作成: gameData.createReceipt, // 伝票作成フラグをログに追加
        デバイス情報: navigator.userAgent.includes("iPhone") ? "iPhone" : "PC",
        時刻: new Date().toLocaleString("ja-JP"),
      })

      // ゲームを作成
      const gameId = await createGame(`${gameData.playerName}のゲーム`)

      // 伝票作成（プレイヤー追加前に作成する必要がある）
      let receiptId: string | undefined
      if (gameData.createReceipt) {
        try {
          receiptId = await createReceipt(gameData.playerId, gameData.playerName, gameId, userName || "system")
          console.log("[v0] 📄 伝票作成完了:", {
            伝票ID: receiptId,
            プレイヤー: gameData.playerName,
            ゲームID: gameId,
          })
        } catch (receiptError) {
          console.error("[v0] ❌ 伝票作成エラー:", receiptError)
          // 伝票作成に失敗してもゲーム開始は継続
        }
      }

      // プレイヤーをゲームに参加させる（プレイ状態もFirestoreで更新される）
      // 購入額も渡して、貯スタックからの引き落としと購入処理を実行
      // 伝票IDを渡すことで、スタック購入項目を直接追加できる
      await addPlayerToGame(gameId, gameData.playerId, gameData.playerName, gameData.buyInAmount, userName || "system", gameData.totalPurchase, receiptId)

      console.log("[v0] ✅ ゲーム開始完了:", {
        ゲームID: gameId,
        プレイヤー: gameData.playerName,
        操作者: userName,
        伝票作成: gameData.createReceipt,
      })

      const message = gameData.createReceipt
        ? `${gameData.playerName}のゲームが開始され、伝票が作成されました`
        : `${gameData.playerName}のゲームが開始されました`
      handleSuccess(message)
    } catch (error) {
      console.error("[v0] ❌ ゲーム開始エラー:", error)
      handleError(error, "ゲーム開始")
    }
  }

  const handleGameUpdate = async (updatedGame: any) => {
    const playingPlayer = players.find((p) => p.isPlaying && p.currentGameId)
    if (!playingPlayer) return

    try {
      const additionalAmount = updatedGame.totalPurchase

      if (additionalAmount > 0) {
        console.log("[v0] 💰 追加スタック操作:", {
          操作者: userName,
          プレイヤー: playingPlayer.name,
          追加額: additionalAmount,
          デバイス情報: navigator.userAgent.includes("iPhone") ? "iPhone" : "PC",
          時刻: new Date().toLocaleString("ja-JP"),
        })

        await updateGameParticipantStack(
          playingPlayer.currentGameId!,
          playingPlayer.id,
          additionalAmount,
          `追加スタック ${additionalAmount}©`,
          userName || "system",
        )

        console.log("[v0] ✅ 追加スタック完了:", {
          プレイヤー: playingPlayer.name,
          追加額: additionalAmount,
          操作者: userName,
        })
      }
    } catch (error) {
      console.error("[v0] ❌ ゲーム更新エラー:", error)
      handleError(error, "ゲーム更新")
    }
  }

  const handleGameEnd = async (finalStack: number, playerId: string) => {
    const targetPlayer = players.find((p) => p.id === playerId && p.isPlaying && p.currentGameId)
    if (!targetPlayer) {
      console.error("[v0] ❌ ゲーム終了対象プレイヤーが見つかりません:", playerId)
      handleError(new Error("ゲーム終了対象のプレイヤーが見つかりません"), "ゲーム終了")
      return
    }

    try {
      console.log("[v0] 🏁 ゲーム終了操作:", {
        操作者: userName,
        プレイヤー: targetPlayer.name,
        プレイヤーID: targetPlayer.id,
        最終スタック: finalStack,
        デバイス情報: navigator.userAgent.includes("iPhone") ? "iPhone" : "PC",
        時刻: new Date().toLocaleString("ja-JP"),
      })

      // ゲーム終了処理（プレイ状態もFirestoreで更新される）
      await endGameWithFinalStacks(
        targetPlayer.currentGameId!,
        [{ playerId: targetPlayer.id, finalStack }],
        userName || "system",
      )

      console.log("[v0] ✅ ゲーム終了完了:", {
        プレイヤー: targetPlayer.name,
        プレイヤーID: targetPlayer.id,
        最終スタック: finalStack,
        操作者: userName,
      })

      handleSuccess(
        `${targetPlayer.name}のゲームが終了しました。最終スタック ${finalStack.toLocaleString()}© がシステム残高に追加されました。`,
      )
    } catch (error) {
      console.error("[v0] ❌ ゲーム終了エラー:", error)
      handleError(error, "ゲーム終了")
    }
  }

  const handlePasswordSuccess = () => {
    if (passwordAction) {
      passwordAction.callback()
      setPasswordAction(null)
    }
  }

  const handlePasswordClose = () => {
    setShowPasswordModal(false)
    setPasswordAction(null)
  }

  const handleViewHistory = (player: Player) => {
    setSelectedPlayer(player)
    setShowHistoryModal(true)
  }

  const handleStartGame = (player: Player) => {
    setSelectedPlayer(player)
    setShowGameStartModal(true)
  }

  const handleTogglePlayerStatus = async (player: Player) => {
    setStatusChangePlayer(player)
    setShowPlayerStatusModal(true)
  }

  const handleStatusChange = async (newStatus: "normal" | "special" | "deduction") => {
    if (!statusChangePlayer) return

    const currentStatus = statusChangePlayer.isSpecial
      ? "special"
      : statusChangePlayer.isDeduction
        ? "deduction"
        : "normal"

    if (newStatus === currentStatus) {
      return
    }

    try {
      await togglePlayerStatus(statusChangePlayer.id, newStatus, userName || "system")

      const statusNames = {
        normal: "通常仕様",
        special: "特別仕様",
        deduction: "差引仕様",
      }

      handleSuccess(`${statusChangePlayer.name}の設定を${statusNames[newStatus]}に変更しました`)
    } catch (error) {
      console.error("[v0] プレイヤー仕様切り替えエラー:", error)
      handleError(error, "設定変更")
    }
  }

  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player)
    setShowPlayerEditModal(true)
  }

  const handleJSONImport = async (jsonData: any[]) => {
    console.log("[v0] JSONインポート詳細開始:", {
      データ数: jsonData.length,
      最初の3件: jsonData.slice(0, 3),
      既存プレイヤー数: players.length,
    })

    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (let i = 0; i < jsonData.length; i++) {
      const playerData = jsonData[i]
      console.log(`[v0] プレイヤー${i + 1}/${jsonData.length}処理開始:`, playerData)

      try {
        const existingPlayer = players.find((p) => p.name === playerData.name)
        if (existingPlayer) {
          console.log(`[v0] プレイヤー重複スキップ: ${playerData.name} (既存ID: ${existingPlayer.id})`)
          skipCount++
          continue
        }

        const now = new Date()
        const storeId = localStorage.getItem("storeId") || ""
        const newPlayerData = {
          uniqueId: `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: playerData.name,
          systemBalance: playerData.systemBalance || 0,
          rewardPoints: 0,
          furigana: playerData.furigana || "",
          pokerName: playerData.pokerName || "",
          isSpecial: playerData.isSpecial || false,
          isDeduction: playerData.isDeduction || false,
          isPlaying: false,
          currentGameId: null,
          storeId: storeId,
          createdAt: now,
          updatedAt: now,
        }
        console.log(`[v0] プレイヤー作成データ:`, newPlayerData)

        console.log(`[v0] addPlayer関数呼び出し開始: ${playerData.name}`)
        await addPlayer(newPlayerData as unknown as Partial<Player>)
        console.log(`[v0] addPlayer関数呼び出し成功: ${playerData.name}`)

        successCount++
      } catch (error) {
        console.error(`[v0] プレイヤー追加エラー (${playerData.name}):`, error)
        errorCount++
        const errorMessage = error instanceof Error ? error.message : "不明なエラー"
        errors.push(`${playerData.name}: ${errorMessage}`)
      }
    }

    console.log("[v0] JSONインポート結果:", {
      成功: successCount,
      スキップ: skipCount,
      エラー: errorCount,
      エラー詳細: errors,
    })

    let message = `インポート完了\n成功: ${successCount}人\nスキップ: ${skipCount}人`
    if (errorCount > 0) {
      message += `\nエラー: ${errorCount}人`
      if (errors.length > 0) {
        message += `\n\nエラー詳細:\n${errors.slice(0, 5).join("\n")}`
        if (errors.length > 5) {
          message += `\n...他${errors.length - 5}件`
        }
      }
    }
    handleSuccess(message)
  }

  const calculateTotalRake = () => {
    console.log("[v0] 📊 レーキ合計計算開始:", {
      レーキ履歴件数: rakeHistory.length,
      レーキ履歴詳細: rakeHistory.map((game) => ({
        プレイヤー名: game.playerName,
        レーキ額: game.rake,
        バイイン: game.buyIn,
        追加スタック: game.additionalStack,
        最終スタック: game.finalStack,
        作成日時: game.createdAt,
      })),
    })

    const total = rakeHistory.reduce((total, game) => total + game.rake, 0)

    console.log("[v0] 📊 レーキ合計計算結果:", {
      合計金額: total,
      計算式: rakeHistory.map((game) => `${game.playerName}: ${game.rake}`).join(" + "),
      表示形式: `${total >= 0 ? "+" : ""}${total.toLocaleString()}©`,
    })

    return total
  }

  const handleDeleteAllPlayers = async () => {
    setPasswordAction({
      type: "deleteAll",
      callback: async () => {
        const confirmMessage = `全プレイヤーを削除しますか？\n\n⚠️ この操作は取り消せません\n⚠️ 現在登録されている${players.length}人のプレイヤーが全て削除されます\n⚠️ ゲーム履歴や取引履歴は残りますが、プレイヤー情報は完全に削除されます\n\n本当に実行しますか？`

        if (!confirm(confirmMessage)) {
          return
        }

        const finalConfirm = confirm("最終確認：本当に全プレイヤーを削除しますか？")
        if (!finalConfirm) {
          return
        }

        try {
          console.log("[v0] 🗑️ 全プレイヤー削除開始")
          await deleteAllPlayers()
          handleSuccess(`全プレイヤー（${players.length}人）を削除しました`)
          await fetchPlayers() // Refresh the list
        } catch (error) {
          console.error("[v0] ❌ 全プレイヤー削除エラー:", error)
          handleError(error, "全プレイヤー削除")
        }
      },
    })
    setShowPasswordModal(true)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div style={{ display: "none" }}>{(() => { console.log("[v0] 🖥️ プレイヤー管理画面DOM構築開始"); return null })()}</div>

        <Header />
        <main className="container mx-auto px-3 py-4 sm:px-6 lg:px-8 sm:py-8" role="main" aria-label="プレイヤー管理">
          {firebaseError && (
            <div className="mb-4 sm:mb-6 lg:mb-8" role="alert" aria-live="polite">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-orange-600 mr-3" aria-hidden="true">
                    ⚠️
                  </div>
                  <div>
                    <h3 className="text-orange-800 font-medium">Firebase設定エラー</h3>
                    <p className="text-orange-700 text-sm mt-1">{firebaseError}</p>
                    <p className="text-orange-600 text-xs mt-2">
                      現在はローカルモードで動作しています。データベース機能を使用するには環境変数を設定してください。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4 sm:mb-6 lg:mb-8">
            <RakeSummaryCard totalRake={calculateTotalRake()} rakeCount={rakeHistory.length} />
          </div>

          <div className="mb-4 sm:mb-6 lg:mb-8">
            <PlayingPlayersCard players={players} playerPurchaseHistory={playerPurchaseHistory} />
          </div>

          <div className="mb-6 sm:mb-8 lg:mb-10">
            <div className="mb-4 lg:mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">プレイヤー管理</h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1 sm:mt-2">
                プレイヤーの登録・残高管理・ゲーム開始
              </p>
            </div>
            <nav
              className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 lg:space-x-4"
              aria-label="プレイヤー管理操作"
            >
              <Button
                variant="outline"
                onClick={handleGenerateAllPlayerIds}
                className="w-full sm:w-auto lg:px-6 lg:py-3 lg:text-base bg-transparent"
                aria-label="全プレイヤーにIDを生成"
              >
                <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-2" aria-hidden="true" />
                全員にID生成
              </Button>
              <SimpleBulkImport onImportComplete={fetchPlayers} />
              <Button
                variant="destructive"
                onClick={handleDeleteAllPlayers}
                className="w-full sm:w-auto lg:px-6 lg:py-3 lg:text-base"
                aria-label="全プレイヤーを削除"
              >
                <Trash2 className="h-4 w-4 lg:h-5 lg:w-5 mr-2" aria-hidden="true" />
                全プレイヤー削除
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPasswordSettings(true)}
                className="w-full sm:w-auto lg:px-6 lg:py-3 lg:text-base"
                aria-label="パスワード設定を開く"
              >
                <Settings className="h-4 w-4 lg:h-5 lg:w-5 mr-2" aria-hidden="true" />
                パスワード設定
              </Button>
              <Button
                onClick={() => setShowRegistrationModal(true)}
                className="w-full sm:w-auto lg:px-6 lg:py-3 lg:text-base"
                aria-label="新規プレイヤーを登録"
              >
                <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-2" aria-hidden="true" />
                新規プレイヤー登録
              </Button>
            </nav>
          </div>

          <div className="mb-4 sm:mb-6 lg:mb-8" role="search">
            <div className="relative w-full sm:max-w-md lg:max-w-lg">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="プレイヤー名・ポーカーネーム・読み仮名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 lg:pl-12 lg:py-3 lg:text-base"
                aria-label="プレイヤー検索"
              />
            </div>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
            role="list"
            aria-label="プレイヤー一覧"
            aria-live="polite"
            aria-atomic="false"
          >
            {filteredPlayers.map((player) => {
              const isPlaying = player.isPlaying
              const totalPurchaseAmount = playerPurchaseHistory[player.id] || 0

              return (
                <div key={player.id} role="listitem">
                  <PlayerCard
                    player={player}
                    isPlaying={isPlaying}
                    totalPurchaseAmount={totalPurchaseAmount}
                    deletingPlayerId={deletingPlayerId}
                    onToggleStatus={handleTogglePlayerStatus}
                    onGenerateId={handleGeneratePlayerId}
                    onEdit={handleEditPlayer}
                    onBalanceManagement={handleBalanceManagement}
                    onViewHistory={handleViewHistory}
                    onStartGame={handleStartGame}
                    onManageGame={handleManageGame}
                    onDelete={handleDeletePlayer}
                  />
                </div>
              )
            })}
          </div>

          {filteredPlayers.length === 0 && !firebaseError && (
            <div className="text-center py-8 sm:py-12 lg:py-16" role="status" aria-live="polite">
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                {searchTerm ? "検索条件に一致するプレイヤーが見つかりません" : "プレイヤーが登録されていません"}
              </p>
            </div>
          )}

          {firebaseError && (
            <div className="text-center py-8 sm:py-12 lg:py-16" role="status" aria-live="polite">
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                Firebase設定完了後にプレイヤーデータが表示されます
              </p>
            </div>
          )}
        </main>

        <PlayerRegistrationModal open={showRegistrationModal} onClose={() => setShowRegistrationModal(false)} />

        <PlayerEditModal
          open={showPlayerEditModal}
          onClose={() => {
            setShowPlayerEditModal(false)
            setSelectedPlayer(null)
          }}
          player={selectedPlayer}
        />

        {selectedPlayer && (
          <>
            <BalanceManagementModal
              open={showBalanceModal}
              onClose={() => {
                setShowBalanceModal(false)
                setSelectedPlayer(null)
              }}
              player={selectedPlayer}
            />
            <TransactionHistoryModal
              open={showHistoryModal}
              onClose={() => {
                setShowHistoryModal(false)
                setSelectedPlayer(null)
              }}
              player={selectedPlayer}
            />
            <GameStartModal
              open={showGameStartModal}
              onClose={() => {
                setShowGameStartModal(false)
                setSelectedPlayer(null)
              }}
              player={selectedPlayer}
              onGameStart={handleGameStart}
            />
          </>
        )}

         {showGameManagementModal && selectedPlayer && selectedPlayer.id && (
          <GameManagementModal
            open={showGameManagementModal}
            onClose={() => {
              setShowGameManagementModal(false)
              setSelectedPlayer(null)
            }}
            player={selectedPlayer as Player}
            onGameEnd={(finalStack) => handleGameEnd(finalStack, selectedPlayer.id)}
            onGameUpdate={handleGameUpdate}
          />
        )}

        <PasswordModal
          open={showPasswordModal}
          onClose={handlePasswordClose}
          onSuccess={handlePasswordSuccess}
          title={
            passwordAction?.type === "balance"
              ? "システム残高調整"
              : passwordAction?.type === "delete"
                ? "プレイヤー削除"
                : "全プレイヤー削除"
          }
          description={
            passwordAction?.type === "balance"
              ? "システム残高を調整するにはパスワードが必要です。"
              : passwordAction?.type === "delete"
                ? "プレイヤーを削除するにはパスワードが必要です。"
                : "全プレイヤーを削除するにはパスワードが必要です。"
          }
        />

        <PasswordSettingsModal open={showPasswordSettings} onClose={() => setShowPasswordSettings(false)} />

        {statusChangePlayer && (
          <PlayerStatusModal
            open={showPlayerStatusModal}
            onClose={() => {
              setShowPlayerStatusModal(false)
              setStatusChangePlayer(null)
            }}
            playerName={statusChangePlayer.name}
            currentStatus={
              statusChangePlayer.isSpecial ? "special" : statusChangePlayer.isDeduction ? "deduction" : "normal"
            }
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </AuthGuard>
  )
}
