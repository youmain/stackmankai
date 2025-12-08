"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PostPreview } from "@/components/post-creation/post-preview"
import { Home, Trash2, Eye, AlertCircle, PlusCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import type { PostData } from "@/types/post"
import { subscribeToUserPosts, deletePost, createPost } from "@/lib/firestore"
import { useAuth } from "@/contexts/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function MyPostsPage() {
  const [posts, setPosts] = useState<PostData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<PostData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreatingSamples, setIsCreatingSamples] = useState(false)

  const { customerAccount } = useAuth()

  useEffect(() => {
    console.log("[v0] my-posts - useAuth customerAccount:", customerAccount)
    console.log("[v0] my-posts - customerAccount?.playerId:", customerAccount?.playerId)
    console.log("[v0] my-posts - customerAccount?.id:", customerAccount?.id)
  }, [customerAccount])

  useEffect(() => {
    let effectiveCustomerAccount = customerAccount

    if (!effectiveCustomerAccount) {
      const savedAccount = sessionStorage.getItem("currentCustomerAccount")
      if (savedAccount) {
        try {
          effectiveCustomerAccount = JSON.parse(savedAccount)
          console.log("[v0] my-posts - customerAccount loaded from sessionStorage:", effectiveCustomerAccount)
        } catch (error) {
          console.error("[v0] my-posts - Failed to parse saved customerAccount:", error)
        }
      }
    }

    if (effectiveCustomerAccount) {
      const userId = effectiveCustomerAccount.playerId || effectiveCustomerAccount.id
      const userName = effectiveCustomerAccount.playerName || "ユーザー"
      setCurrentUserId(userId)
      setCurrentUserName(userName)

      console.log("[v0] 自分の投稿履歴取得開始:", userId)

      const unsubscribe = subscribeToUserPosts(userId, (userPosts) => {
        console.log("[v0] 自分の投稿データ受信:", userPosts.length, "件")
        setPosts(userPosts)
        setIsLoading(false)
      })

      return () => {
        if (unsubscribe) unsubscribe()
      }
    } else {
      console.log("[v0] ユーザー情報が見つかりません")
      setIsLoading(false)
    }
  }, [customerAccount])

  const handleCreateSamplePosts = async () => {
    if (!currentUserId || !currentUserName) {
      alert("ユーザー情報が見つかりません")
      return
    }

    setIsCreatingSamples(true)
    try {
      const samplePosts = [
        {
          title: "AA vs KK プリフロップオールイン",
          authorId: currentUserId,
          authorName: currentUserName,
          situation:
            "UTGでAAを持っていて、レイズしたところ、BTNから3betが入りました。4betしたところオールインされたのでコールしました。",
          gameType: "キャッシュゲーム",
          blinds: "100/200",
          position: "UTG",
          stackSize: "20,000円",
          seekingAdvice: false,
          visibility: "public" as const,
          preflop: {
            holeCards: [
              { suit: "spades", rank: "A" },
              { suit: "hearts", rank: "A" },
            ] as [any, any],
            action: "4bet → オールインコール",
            betAmount: "20,000円",
            description:
              "UTGでAAを持っていたので、2.5BBにレイズ。BTNから3bet（8BB）が入ったので、4bet（20BB）にレイズ。相手がオールイン（100BB）してきたので即コール。相手はKKを持っていました。",
            situation: "UTGでAAを持っていて、レイズしたところ、BTNから3betが入りました。",
            players: [
              {
                id: "hero",
                name: "Hero (UTG)",
                position: 0,
                stack: 0,
                bet: 20000,
                cards: [
                  { suit: "spades", rank: "A" },
                  { suit: "hearts", rank: "A" },
                ] as [any, any],
                action: "all-in" as const,
                isActive: true,
              },
              {
                id: "btn",
                name: "BTN",
                position: 5,
                stack: 0,
                bet: 20000,
                cards: [
                  { suit: "diamonds", rank: "K" },
                  { suit: "clubs", rank: "K" },
                ] as [any, any],
                action: "all-in" as const,
                isActive: true,
                isDealer: true,
              },
            ],
            communityCards: [],
            pot: 40000,
            currentBet: 20000,
            heroPosition: 0,
          },
          flop: {
            communityCards: [
              { suit: "spades", rank: "Q" },
              { suit: "hearts", rank: "7" },
              { suit: "clubs", rank: "2" },
            ] as [any, any, any],
            action: "オールイン済み",
            betAmount: "0円",
            description:
              "フロップはQ♠ 7♥ 2♣。プリフロップでオールインしているので、アクションはありません。相手のKKに対してAAが優勢な状況です。",
            players: [
              {
                id: "hero",
                name: "Hero (UTG)",
                position: 0,
                stack: 0,
                bet: 0,
                cards: [
                  { suit: "spades", rank: "A" },
                  { suit: "hearts", rank: "A" },
                ] as [any, any],
                isActive: true,
              },
              {
                id: "btn",
                name: "BTN",
                position: 5,
                stack: 0,
                bet: 0,
                cards: [
                  { suit: "diamonds", rank: "K" },
                  { suit: "clubs", rank: "K" },
                ] as [any, any],
                isActive: true,
                isDealer: true,
              },
            ],
            pot: 40000,
            currentBet: 0,
            heroPosition: 0,
          },
          turn: {
            communityCards: [
              { suit: "spades", rank: "Q" },
              { suit: "hearts", rank: "7" },
              { suit: "clubs", rank: "2" },
              { suit: "diamonds", rank: "9" },
            ] as [any, any, any, any],
            communityCard: { suit: "diamonds", rank: "9" },
            action: "オールイン済み",
            betAmount: "0円",
            description: "ターンは9♦。まだAAが優勢です。相手がKを引く可能性は残り2枚なので、約4.5%の確率です。",
            players: [
              {
                id: "hero",
                name: "Hero (UTG)",
                position: 0,
                stack: 0,
                bet: 0,
                cards: [
                  { suit: "spades", rank: "A" },
                  { suit: "hearts", rank: "A" },
                ] as [any, any],
                isActive: true,
              },
              {
                id: "btn",
                name: "BTN",
                position: 5,
                stack: 0,
                bet: 0,
                cards: [
                  { suit: "diamonds", rank: "K" },
                  { suit: "clubs", rank: "K" },
                ] as [any, any],
                isActive: true,
                isDealer: true,
              },
            ],
            pot: 40000,
            currentBet: 0,
            heroPosition: 0,
          },
          river: {
            communityCards: [
              { suit: "spades", rank: "Q" },
              { suit: "hearts", rank: "7" },
              { suit: "clubs", rank: "2" },
              { suit: "diamonds", rank: "9" },
              { suit: "spades", rank: "3" },
            ] as [any, any, any, any, any],
            communityCard: { suit: "spades", rank: "3" },
            action: "オールイン済み",
            betAmount: "0円",
            description:
              "リバーは3♠。相手はKを引けず、AAが勝利しました。ボードは Q♠ 7♥ 2♣ 9♦ 3♠ で、AAのワンペアが勝ちました。",
            players: [
              {
                id: "hero",
                name: "Hero (UTG)",
                position: 0,
                stack: 40000,
                bet: 0,
                cards: [
                  { suit: "spades", rank: "A" },
                  { suit: "hearts", rank: "A" },
                ] as [any, any],
                isActive: true,
              },
              {
                id: "btn",
                name: "BTN",
                position: 5,
                stack: 0,
                bet: 0,
                cards: [
                  { suit: "diamonds", rank: "K" },
                  { suit: "clubs", rank: "K" },
                ] as [any, any],
                isActive: false,
                isDealer: true,
              },
            ],
            pot: 40000,
            currentBet: 0,
            heroPosition: 0,
          },
          reflection: {
            result: "勝ち（+20,000円）",
            thoughts:
              "AAでプリフロップオールインは正しいプレイだったと思います。相手のKKに対して約80%の勝率があり、期待値的にも正しい判断でした。結果的にKが落ちずに勝つことができました。プリフロップでAAを持った時は、基本的にオールインを受け入れるべきだと再確認できました。",
            seekingAdvice: false,
            postCategory: "プリフロップオールイン",
            visibility: "public" as const,
          },
        },
        {
          title: "フラッシュドローでセミブラフオールイン",
          authorId: currentUserId,
          authorName: currentUserName,
          situation: "COでA♦K♦を持っていて、レイズしたところBBがコール。フロップでフラッシュドローを引きました。",
          gameType: "トーナメント",
          blinds: "200/400",
          position: "CO",
          stackSize: "15,000円",
          seekingAdvice: true,
          visibility: "public" as const,
          preflop: {
            holeCards: [
              { suit: "diamonds", rank: "A" },
              { suit: "diamonds", rank: "K" },
            ] as [any, any],
            action: "レイズ",
            betAmount: "1,000円",
            description:
              "COでA♦K♦を持っていたので、2.5BBにレイズ。BBがコールしました。ヘッズアップでフロップを見ることになりました。",
            situation: "COでA♦K♦を持っていて、レイズしたところBBがコール。",
            players: [
              {
                id: "hero",
                name: "Hero (CO)",
                position: 4,
                stack: 14000,
                bet: 1000,
                cards: [
                  { suit: "diamonds", rank: "A" },
                  { suit: "diamonds", rank: "K" },
                ] as [any, any],
                action: "raise" as const,
                isActive: true,
              },
              {
                id: "bb",
                name: "BB",
                position: 7,
                stack: 14000,
                bet: 1000,
                cards: [
                  { suit: "spades", rank: "Q" },
                  { suit: "hearts", rank: "Q" },
                ] as [any, any],
                action: "call" as const,
                isActive: true,
              },
            ],
            communityCards: [],
            pot: 2200,
            currentBet: 1000,
            heroPosition: 4,
          },
          flop: {
            communityCards: [
              { suit: "diamonds", rank: "9" },
              { suit: "diamonds", rank: "6" },
              { suit: "spades", rank: "2" },
            ] as [any, any, any],
            action: "チェック → ベット",
            betAmount: "1,500円",
            description:
              "フロップは9♦ 6♦ 2♠。フラッシュドローを引きました。BBがチェックしたので、Cベットとして1,500円をベット。BBがコールしました。",
            players: [
              {
                id: "hero",
                name: "Hero (CO)",
                position: 4,
                stack: 12500,
                bet: 1500,
                cards: [
                  { suit: "diamonds", rank: "A" },
                  { suit: "diamonds", rank: "K" },
                ] as [any, any],
                action: "bet" as const,
                isActive: true,
              },
              {
                id: "bb",
                name: "BB",
                position: 7,
                stack: 12500,
                bet: 1500,
                cards: [
                  { suit: "spades", rank: "Q" },
                  { suit: "hearts", rank: "Q" },
                ] as [any, any],
                action: "call" as const,
                isActive: true,
              },
            ],
            pot: 5200,
            currentBet: 1500,
            heroPosition: 4,
          },
          turn: {
            communityCards: [
              { suit: "diamonds", rank: "9" },
              { suit: "diamonds", rank: "6" },
              { suit: "spades", rank: "2" },
              { suit: "diamonds", rank: "5" },
            ] as [any, any, any, any],
            communityCard: { suit: "diamonds", rank: "5" },
            action: "チェック → オールイン",
            betAmount: "12,500円",
            description:
              "ターンは5♦。フラッシュが完成しました！BBがチェックしたので、バリューを取るためにオールイン（残り12,500円）。BBは長考の末、コールしました。相手はQ♠Q♥を持っていました。",
            players: [
              {
                id: "hero",
                name: "Hero (CO)",
                position: 4,
                stack: 0,
                bet: 12500,
                cards: [
                  { suit: "diamonds", rank: "A" },
                  { suit: "diamonds", rank: "K" },
                ] as [any, any],
                action: "all-in" as const,
                isActive: true,
              },
              {
                id: "bb",
                name: "BB",
                position: 7,
                stack: 0,
                bet: 12500,
                cards: [
                  { suit: "spades", rank: "Q" },
                  { suit: "hearts", rank: "Q" },
                ] as [any, any],
                action: "call" as const,
                isActive: true,
              },
            ],
            pot: 30200,
            currentBet: 12500,
            heroPosition: 4,
          },
          river: {
            communityCards: [
              { suit: "diamonds", rank: "9" },
              { suit: "diamonds", rank: "6" },
              { suit: "spades", rank: "2" },
              { suit: "diamonds", rank: "5" },
              { suit: "clubs", rank: "8" },
            ] as [any, any, any, any, any],
            communityCard: { suit: "clubs", rank: "8" },
            action: "オールイン済み",
            betAmount: "0円",
            description:
              "リバーは8♣。ボードは 9♦ 6♦ 2♠ 5♦ 8♣ で、A♦K♦のナットフラッシュが勝利しました。相手のQQを破ることができました。",
            players: [
              {
                id: "hero",
                name: "Hero (CO)",
                position: 4,
                stack: 30200,
                bet: 0,
                cards: [
                  { suit: "diamonds", rank: "A" },
                  { suit: "diamonds", rank: "K" },
                ] as [any, any],
                isActive: true,
              },
              {
                id: "bb",
                name: "BB",
                position: 7,
                stack: 0,
                bet: 0,
                cards: [
                  { suit: "spades", rank: "Q" },
                  { suit: "hearts", rank: "Q" },
                ] as [any, any],
                isActive: false,
              },
            ],
            pot: 30200,
            currentBet: 0,
            heroPosition: 4,
          },
          reflection: {
            result: "勝ち（+15,000円）",
            thoughts:
              "フロップでフラッシュドローを引いた時のプレイについて、もっと良い方法があったか気になります。ターンでフラッシュが完成した時にオールインしましたが、もっと小さいベットでバリューを取る方が良かったかもしれません。相手がQQを持っていたので結果的にオールインをコールしてもらえましたが、もし相手が弱いハンドだったらフォールドされていた可能性があります。フラッシュ完成時のベットサイジングについてアドバイスをいただけると嬉しいです。",
            seekingAdvice: true,
            postCategory: "ドローハンド",
            visibility: "public" as const,
          },
        },
        {
          title: "6人テーブルでのマルチウェイポット - BTNでAKs",
          authorId: currentUserId,
          authorName: currentUserName,
          situation:
            "6人テーブルのキャッシュゲーム（SB ©50 / BB ©100）でプレイしていました。\n私のスタックは約10,000©、テーブルの平均スタックも同じくらいでした。\n\nBTN（ボタン）でA♠K♠という強いハンドをもらい、UTGのレイズに対してどのようにプレイするか考えました。",
          gameType: "キャッシュゲーム",
          blinds: "50/100",
          position: "BTN",
          stackSize: "10,000円",
          seekingAdvice: true,
          visibility: "public" as const,
          preflop: {
            holeCards: [
              { suit: "spades", rank: "A" },
              { suit: "spades", rank: "K" },
            ] as [any, any],
            action: "3bet",
            betAmount: "900円",
            description:
              "UTGが300円にレイズ、MPがコール。私はBTNでA♠K♠を持っていたので、900円に3betしました。SBとBBはフォールド、UTGとMPの両方がコールしました。",
            situation: "UTGが300円にレイズ、MPがコール。私はBTNでA♠K♠を持っていたので、3betしました。",
            players: [
              {
                id: "utg",
                name: "UTG",
                position: 0,
                stack: 9700,
                bet: 900,
                action: "call" as const,
                isActive: true,
              },
              {
                id: "mp",
                name: "MP",
                position: 2,
                stack: 9700,
                bet: 900,
                action: "call" as const,
                isActive: true,
              },
              {
                id: "hero",
                name: "Hero (BTN)",
                position: 5,
                stack: 9100,
                bet: 900,
                cards: [
                  { suit: "spades", rank: "A" },
                  { suit: "spades", rank: "K" },
                ] as [any, any],
                isActive: true,
                isDealer: true,
              },
              {
                id: "sb",
                name: "SB",
                position: 6,
                stack: 10000,
                bet: 0,
                action: "fold" as const,
                isActive: false,
              },
              {
                id: "bb",
                name: "BB",
                position: 7,
                stack: 10000,
                bet: 0,
                action: "fold" as const,
                isActive: false,
              },
            ],
            communityCards: [],
            pot: 2850,
            currentBet: 900,
            heroPosition: 5,
          },
          flop: {
            communityCards: [
              { suit: "hearts", rank: "A" },
              { suit: "diamonds", rank: "K" },
              { suit: "clubs", rank: "7" },
            ] as [any, any, any],
            action: "bet",
            betAmount: "1,800円",
            description:
              "フロップはA♥ K♦ 7♣。トップツーペアを作りました！UTGとMPがチェックしたので、ポットの約60%（1,800円）をベット。UTGがコール、MPはフォールドしました。",
            players: [
              {
                id: "utg",
                name: "UTG",
                position: 0,
                stack: 7900,
                bet: 1800,
                action: "call" as const,
                isActive: true,
              },
              {
                id: "mp",
                name: "MP",
                position: 2,
                stack: 9700,
                bet: 0,
                action: "fold" as const,
                isActive: false,
              },
              {
                id: "hero",
                name: "Hero (BTN)",
                position: 5,
                stack: 7300,
                bet: 1800,
                cards: [
                  { suit: "spades", rank: "A" },
                  { suit: "spades", rank: "K" },
                ] as [any, any],
                isActive: true,
                isDealer: true,
              },
            ],
            pot: 6450,
            currentBet: 1800,
            heroPosition: 5,
          },
          turn: {
            communityCards: [
              { suit: "hearts", rank: "A" },
              { suit: "diamonds", rank: "K" },
              { suit: "clubs", rank: "7" },
              { suit: "spades", rank: "2" },
            ] as [any, any, any, any],
            communityCard: { suit: "spades", rank: "2" },
            action: "bet",
            betAmount: "3,500円",
            description:
              "ターンは2♠。ボードはA♥ K♦ 7♣ 2♠。UTGがチェックしたので、バリューを取るために3,500円をベット。UTGは長考の末、コールしました。",
            players: [
              {
                id: "utg",
                name: "UTG",
                position: 0,
                stack: 4400,
                bet: 3500,
                action: "call" as const,
                isActive: true,
              },
              {
                id: "hero",
                name: "Hero (BTN)",
                position: 5,
                stack: 3800,
                bet: 3500,
                cards: [
                  { suit: "spades", rank: "A" },
                  { suit: "spades", rank: "K" },
                ] as [any, any],
                isActive: true,
                isDealer: true,
              },
            ],
            pot: 13450,
            currentBet: 3500,
            heroPosition: 5,
          },
          river: {
            communityCards: [
              { suit: "hearts", rank: "A" },
              { suit: "diamonds", rank: "K" },
              { suit: "clubs", rank: "7" },
              { suit: "spades", rank: "2" },
              { suit: "clubs", rank: "9" },
            ] as [any, any, any, any, any],
            communityCard: { suit: "clubs", rank: "9" },
            action: "bet",
            betAmount: "3,800円",
            description:
              "リバーは9♣。ボードはA♥ K♦ 7♣ 2♠ 9♣。UTGがチェックしたので、残りスタック全額（3,800円）をベット。UTGは長考の末、コールしました。相手はA♦Q♦を持っていて、同じトップペアでしたが、私のキッカーが勝っていました。",
            players: [
              {
                id: "utg",
                name: "UTG",
                position: 0,
                stack: 600,
                bet: 3800,
                action: "call" as const,
                cards: [
                  { suit: "diamonds", rank: "A" },
                  { suit: "diamonds", rank: "Q" },
                ] as [any, any],
                isActive: true,
              },
              {
                id: "hero",
                name: "Hero (BTN)",
                position: 5,
                stack: 0,
                bet: 3800,
                cards: [
                  { suit: "spades", rank: "A" },
                  { suit: "spades", rank: "K" },
                ] as [any, any],
                isActive: true,
                isDealer: true,
              },
            ],
            pot: 21050,
            currentBet: 3800,
            heroPosition: 5,
          },
          reflection: {
            result: "勝利 - トップツーペアで約21,000円のポットを獲得",
            thoughts:
              "結果的にトップツーペアで勝つことができましたが、プレイに疑問が残ります。\n\nまず、プリフロップでの3betについて。UTGのレイズに対してMPがコールしている状況で、BTNから3betするのは正しかったのでしょうか？A♠K♠は強いハンドですが、マルチウェイになる可能性が高い状況でした。結果的に両方がコールしてマルチウェイポットになりました。\n\nフロップでトップツーペアを作った時のベットサイジングについても気になります。ポットの60%をベットしましたが、もっと大きくベットしてバリューを取るべきだったかもしれません。\n\nターンとリバーでのベットサイジングも、もっと最適化できたと思います。特にリバーでは、相手のスタックサイズを考慮して、もっと小さいベットでコールを引き出す方が良かったかもしれません。\n\nマルチウェイポットでのプレイと、トップツーペアでのバリューベットのサイジングについて、アドバイスをいただけると嬉しいです！",
            seekingAdvice: true,
            postCategory: "マルチウェイポット",
            visibility: "public" as const,
          },
        },
      ]

      console.log("[v0] サンプル投稿作成開始:", samplePosts.length, "件")

      for (const post of samplePosts) {
        await createPost(post as any)
        console.log("[v0] サンプル投稿作成完了:", post.title)
      }

      console.log("[v0] 全サンプル投稿作成完了")
      alert("詳細なサンプル投稿を作成しました！")
    } catch (error: any) {
      console.error("[v0] サンプル投稿作成エラー:", error)
      alert(`サンプル投稿の作成に失敗しました: ${error.message}`)
    } finally {
      setIsCreatingSamples(false)
    }
  }

  const handleDeleteClick = (post: PostData) => {
    setPostToDelete(post)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return

    setIsDeleting(true)
    try {
      await deletePost(postToDelete.id)
      console.log("[v0] 投稿削除成功:", postToDelete.id)
      setDeleteConfirmOpen(false)
      setPostToDelete(null)
    } catch (error) {
      console.error("[v0] 投稿削除エラー:", error)
      alert("投稿の削除に失敗しました。もう一度お試しください。")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUserId) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-4">
          <Link href="/customer-view">
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Home className="w-4 h-4" />
              マイページに戻る
            </Button>
          </Link>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>ログインが必要です。マイページからログインしてください。</AlertDescription>
        </Alert>
      </div>
    )
  }

  const remainingSlots = 3 - posts.length

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-4">
        <Link href="/customer-view">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Home className="w-4 h-4" />
            マイページに戻る
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">自分の投稿履歴</h1>
          <p className="text-muted-foreground">
            投稿数: {posts.length} / 3件 {remainingSlots > 0 && `（残り${remainingSlots}件投稿可能）`}
          </p>
        </div>
        <div className="flex gap-2">
          {posts.length === 0 && (
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
              onClick={handleCreateSamplePosts}
              disabled={isCreatingSamples}
            >
              <Sparkles className="w-4 h-4" />
              {isCreatingSamples ? "作成中..." : "サンプル投稿を作成"}
            </Button>
          )}
          <Link href="/create-post">
            <Button className="flex items-center gap-2" disabled={posts.length >= 3}>
              <PlusCircle className="w-4 h-4" />
              新規投稿
            </Button>
          </Link>
        </div>
      </div>

      {posts.length >= 3 && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            投稿数の上限（3件）に達しています。新しい投稿を作成するには、既存の投稿を削除してください。
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">まだ投稿がありません。</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                  onClick={handleCreateSamplePosts}
                  disabled={isCreatingSamples}
                >
                  <Sparkles className="w-4 h-4" />
                  {isCreatingSamples ? "作成中..." : "サンプル投稿を作成"}
                </Button>
                <Link href="/create-post">
                  <Button className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    最初の投稿を作成
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => <MyPostCard key={post.id} post={post} onDelete={handleDeleteClick} />)
        )}
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>投稿を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。投稿「{postToDelete?.title}」を完全に削除します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MyPostCard({ post, onDelete }: { post: PostData; onDelete: (post: PostData) => void }) {
  const [showPreview, setShowPreview] = useState(false)

  console.log("[v0] MyPostCard - 投稿データ:", {
    id: post.id,
    title: post.title,
    situation: post.situation,
    thoughts: post.reflection?.thoughts,
  })

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{post.title}</CardTitle>
              <Badge variant={post.visibility === "public" ? "default" : "secondary"}>
                {post.visibility === "public" ? "公開" : "店舗限定"}
              </Badge>
              {post.seekingAdvice && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  アドバイス求む
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{new Date(post.createdAt).toLocaleDateString("ja-JP")}</span>
              <span>
                {new Date(post.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <span className="text-xs font-semibold text-primary">状況説明:</span>
        </div>
        <p className="text-muted-foreground mb-4 line-clamp-3">{typeof post.situation === "string" ? post.situation : post.situation.description || ""}</p>
        {post.reflection?.thoughts && (
          <div className="mb-4">
            <span className="text-xs font-semibold text-primary">感想:</span>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{post.reflection.thoughts}</p>
          </div>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{post.views || 0} 閲覧</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? "プレビューを閉じる" : "プレビューを表示"}
          </Button>
          <Link href={`/posts/${post.id}`}>
            <Button size="sm" variant="secondary">
              詳細を見る
            </Button>
          </Link>
          <Button size="sm" variant="destructive" onClick={() => onDelete(post)} className="ml-auto">
            <Trash2 className="w-4 h-4 mr-1" />
            削除
          </Button>
        </div>
        {showPreview && (
          <div className="mt-6 border-t pt-6">
            <PostPreview postData={post} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
