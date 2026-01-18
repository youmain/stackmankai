"use client"

import { useState, useEffect } from "react"
import { Home, AlertCircle, PlusCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import type { PostData } from "@/types/post"
import { subscribeToUserPosts, deletePost, createPost } from "@/lib/firestore"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PostList } from "@/components/my-posts/post-list"
import { PostDeleteDialog } from "@/components/my-posts/delete-dialog"
import { PostHeader } from "@/components/my-posts/post-header"
import { LoadingScreen } from "@/components/my-posts/loading-screen"
import { NotLoggedInScreen } from "@/components/my-posts/not-logged-in-screen"

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
          seekingAdvice: true,
          visibility: "public" as const,
          preflop: {
            holeCards: [
              { suit: "spades", rank: "A" },
              { suit: "hearts", rank: "A" },
            ] as [any, any],
            action: "4bet",
            betAmount: "2000円",
            description:
              "UTGでAAを持っていて、レイズしたところ、BTNから3betが入りました。4betしたところオールインされたのでコールしました。",
            situation: "UTGでAAを持っていて、レイズしたところ、BTNから3betが入りました。",
            players: [
              {
                id: "hero",
                name: "Hero (UTG)",
                position: 0,
                stack: 18000,
                bet: 2000,
                cards: [
                  { suit: "spades", rank: "A" },
                  { suit: "hearts", rank: "A" },
                ] as [any, any],
                action: "4bet" as const,
                isActive: true,
              },
              {
                id: "btn",
                name: "BTN",
                position: 4,
                stack: 18000,
                bet: 2000,
                cards: [
                  { suit: "diamonds", rank: "K" },
                  { suit: "clubs", rank: "K" },
                ] as [any, any],
                action: "all-in" as const,
                isActive: true,
              },
            ],
            communityCards: [],
            pot: 4200,
            currentBet: 2000,
            heroPosition: 0,
          },
          flop: {
            communityCards: [
              { suit: "diamonds", rank: "9" },
              { suit: "diamonds", rank: "6" },
              { suit: "spades", rank: "2" },
            ] as [any, any, any],
            communityCard: { suit: "spades", rank: "2" },
            action: "オールイン済み",
            betAmount: "0円",
            description: "フロップは 9♦ 6♦ 2♠。AAはまだ最強です。",
            players: [
              {
                id: "hero",
                name: "Hero (UTG)",
                position: 0,
                stack: 18000,
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
                position: 4,
                stack: 0,
                bet: 0,
                cards: [
                  { suit: "diamonds", rank: "K" },
                  { suit: "clubs", rank: "K" },
                ] as [any, any],
                isActive: true,
              },
            ],
            pot: 4200,
            currentBet: 0,
            heroPosition: 0,
          },
          turn: {
            communityCards: [
              { suit: "diamonds", rank: "9" },
              { suit: "diamonds", rank: "6" },
              { suit: "spades", rank: "2" },
              { suit: "diamonds", rank: "5" },
            ] as [any, any, any, any],
            communityCard: { suit: "diamonds", rank: "5" },
            action: "オールイン済み",
            betAmount: "0円",
            description: "ターンは 5♦。ボードは 9♦ 6♦ 2♠ 5♦ で、AAはまだ最強です。",
            players: [
              {
                id: "hero",
                name: "Hero (UTG)",
                position: 0,
                stack: 18000,
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
                position: 4,
                stack: 0,
                bet: 0,
                cards: [
                  { suit: "diamonds", rank: "K" },
                  { suit: "clubs", rank: "K" },
                ] as [any, any],
                isActive: true,
              },
            ],
            pot: 4200,
            currentBet: 0,
            heroPosition: 0,
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
              "リバーは8♣。ボードは 9♦ 6♦ 2♠ 5♦ 8♣ で、AAが勝利しました。相手のKKを破ることができました。",
            players: [
              {
                id: "hero",
                name: "Hero (UTG)",
                position: 0,
                stack: 8400,
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
                position: 4,
                stack: 0,
                bet: 0,
                cards: [
                  { suit: "diamonds", rank: "K" },
                  { suit: "clubs", rank: "K" },
                ] as [any, any],
                isActive: false,
              },
            ],
            pot: 4200,
            currentBet: 0,
            heroPosition: 0,
          },
          reflection: {
            result: "勝ち（+2,100円）",
            thoughts:
              "AAでのプリフロップオールインは標準的なプレイです。相手がKKを持っていたので、ショーダウンまで行きました。結果的に勝利しましたが、このようなコインフリップの状況では、長期的には利益を生み出すことができます。",
            seekingAdvice: false,
            postCategory: "プリフロップ",
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
              { suit: "clubs", rank: "9" },
            ] as [any, any, any],
            communityCard: { suit: "clubs", rank: "9" },
            action: "check",
            betAmount: "0円",
            description:
              "フロップは A♥ K♦ 9♣。最高のフロップです。UTGがチェック、MPがチェック、私はベットしました。",
            players: [
              {
                id: "utg",
                name: "UTG",
                position: 0,
                stack: 9700,
                bet: 0,
                action: "check" as const,
                isActive: true,
              },
              {
                id: "mp",
                name: "MP",
                position: 2,
                stack: 9700,
                bet: 0,
                action: "check" as const,
                isActive: true,
              },
              {
                id: "hero",
                name: "Hero (BTN)",
                position: 5,
                stack: 9100,
                bet: 1500,
                cards: [
                  { suit: "spades", rank: "A" },
                  { suit: "spades", rank: "K" },
                ] as [any, any],
                isActive: true,
              },
            ],
            communityCards: [
              { suit: "hearts", rank: "A" },
              { suit: "diamonds", rank: "K" },
              { suit: "clubs", rank: "9" },
            ] as [any, any, any],
            pot: 2850,
            currentBet: 1500,
            heroPosition: 5,
          },
          turn: {
            communityCards: [
              { suit: "hearts", rank: "A" },
              { suit: "diamonds", rank: "K" },
              { suit: "clubs", rank: "9" },
              { suit: "diamonds", rank: "5" },
            ] as [any, any, any, any],
            communityCard: { suit: "diamonds", rank: "5" },
            action: "call",
            betAmount: "3000円",
            description:
              "ターンは 5♦。UTGが3000円ベット、MPがフォールド、私はコール。",
            players: [
              {
                id: "utg",
                name: "UTG",
                position: 0,
                stack: 6700,
                bet: 3000,
                action: "bet" as const,
                isActive: true,
              },
              {
                id: "hero",
                name: "Hero (BTN)",
                position: 5,
                stack: 6100,
                bet: 3000,
                cards: [
                  { suit: "spades", rank: "A" },
                  { suit: "spades", rank: "K" },
                ] as [any, any],
                isActive: true,
              },
            ],
            communityCards: [
              { suit: "hearts", rank: "A" },
              { suit: "diamonds", rank: "K" },
              { suit: "clubs", rank: "9" },
              { suit: "diamonds", rank: "5" },
            ] as [any, any, any, any],
            pot: 8850,
            currentBet: 3000,
            heroPosition: 5,
          },
          river: {
            communityCards: [
              { suit: "hearts", rank: "A" },
              { suit: "diamonds", rank: "K" },
              { suit: "clubs", rank: "9" },
              { suit: "diamonds", rank: "5" },
              { suit: "hearts", rank: "Q" },
            ] as [any, any, any, any, any],
            communityCard: { suit: "hearts", rank: "Q" },
            action: "check",
            betAmount: "0円",
            description:
              "リバーは Q♥。UTGがチェック、私もチェック。ショーダウンで、私のAKがUTGのAQを破りました。",
            players: [
              {
                id: "utg",
                name: "UTG",
                position: 0,
                stack: 0,
                bet: 0,
                action: "check" as const,
                isActive: true,
              },
              {
                id: "hero",
                name: "Hero (BTN)",
                position: 5,
                stack: 14850,
                bet: 0,
                cards: [
                  { suit: "spades", rank: "A" },
                  { suit: "spades", rank: "K" },
                ] as [any, any],
                isActive: true,
              },
            ],
            communityCards: [
              { suit: "hearts", rank: "A" },
              { suit: "diamonds", rank: "K" },
              { suit: "clubs", rank: "9" },
              { suit: "diamonds", rank: "5" },
              { suit: "hearts", rank: "Q" },
            ] as [any, any, any, any, any],
            pot: 14850,
            currentBet: 0,
            heroPosition: 5,
          },
          reflection: {
            result: "勝ち（+4,850円）",
            thoughts:
              "AKsでのプレイは良かったと思います。フロップでの強いハンドに対してバリューベットを打ち、ターンでのコールも正しい判断だったと思います。ただし、もう少し早い段階でオールインを検討しても良かったかもしれません。",
            seekingAdvice: false,
            postCategory: "ハイカード",
            visibility: "public" as const,
          },
        },
        {
          title: "JJ でのコールド3ベット - キャッシュゲーム",
          authorId: currentUserId,
          authorName: currentUserName,
          situation:
            "キャッシュゲーム（100/200）でプレイしていました。MP がレイズ、CO がコール、私は SB で JJ を持っていました。",
          gameType: "キャッシュゲーム",
          blinds: "100/200",
          position: "SB",
          stackSize: "15,000円",
          seekingAdvice: true,
          visibility: "public" as const,
          preflop: {
            holeCards: [
              { suit: "clubs", rank: "J" },
              { suit: "diamonds", rank: "J" },
            ] as [any, any],
            action: "3bet",
            betAmount: "1200円",
            description:
              "MP がレイズ、CO がコール、私は SB で JJ を持っていたので、3bet しました。",
            situation: "MP がレイズ、CO がコール、私は SB で JJ を持っていました。",
            players: [
              {
                id: "mp",
                name: "MP",
                position: 2,
                stack: 14800,
                bet: 1200,
                action: "raise" as const,
                isActive: true,
              },
              {
                id: "co",
                name: "CO",
                position: 3,
                stack: 14800,
                bet: 1200,
                action: "call" as const,
                isActive: true,
              },
              {
                id: "hero",
                name: "Hero (SB)",
                position: 5,
                stack: 13800,
                bet: 1200,
                cards: [
                  { suit: "clubs", rank: "J" },
                  { suit: "diamonds", rank: "J" },
                ] as [any, any],
                isActive: true,
              },
              {
                id: "bb",
                name: "BB",
                position: 6,
                stack: 15000,
                bet: 0,
                action: "fold" as const,
                isActive: false,
              },
            ],
            communityCards: [],
            pot: 3600,
            currentBet: 1200,
            heroPosition: 5,
          },
          flop: {
            communityCards: [
              { suit: "spades", rank: "K" },
              { suit: "hearts", rank: "9" },
              { suit: "diamonds", rank: "4" },
            ] as [any, any, any],
            communityCard: { suit: "diamonds", rank: "4" },
            action: "check",
            betAmount: "0円",
            description:
              "フロップは K♠ 9♥ 4♦。MP がベット、CO がコール、私はコール。",
            players: [
              {
                id: "mp",
                name: "MP",
                position: 2,
                stack: 13600,
                bet: 1200,
                action: "bet" as const,
                isActive: true,
              },
              {
                id: "co",
                name: "CO",
                position: 3,
                stack: 13600,
                bet: 1200,
                action: "call" as const,
                isActive: true,
              },
              {
                id: "hero",
                name: "Hero (SB)",
                position: 5,
                stack: 12600,
                bet: 1200,
                cards: [
                  { suit: "clubs", rank: "J" },
                  { suit: "diamonds", rank: "J" },
                ] as [any, any],
                isActive: true,
              },
            ],
            communityCards: [
              { suit: "spades", rank: "K" },
              { suit: "hearts", rank: "9" },
              { suit: "diamonds", rank: "4" },
            ] as [any, any, any],
            pot: 3600,
            currentBet: 1200,
            heroPosition: 5,
          },
          turn: {
            communityCards: [
              { suit: "spades", rank: "K" },
              { suit: "hearts", rank: "9" },
              { suit: "diamonds", rank: "4" },
              { suit: "clubs", rank: "2" },
            ] as [any, any, any, any],
            communityCard: { suit: "clubs", rank: "2" },
            action: "check",
            betAmount: "0円",
            description:
              "ターンは 2♣。MP がチェック、CO がチェック、私もチェック。",
            players: [
              {
                id: "mp",
                name: "MP",
                position: 2,
                stack: 13600,
                bet: 0,
                action: "check" as const,
                isActive: true,
              },
              {
                id: "co",
                name: "CO",
                position: 3,
                stack: 13600,
                bet: 0,
                action: "check" as const,
                isActive: true,
              },
              {
                id: "hero",
                name: "Hero (SB)",
                position: 5,
                stack: 12600,
                bet: 0,
                cards: [
                  { suit: "clubs", rank: "J" },
                  { suit: "diamonds", rank: "J" },
                ] as [any, any],
                isActive: true,
              },
            ],
            communityCards: [
              { suit: "spades", rank: "K" },
              { suit: "hearts", rank: "9" },
              { suit: "diamonds", rank: "4" },
              { suit: "clubs", rank: "2" },
            ] as [any, any, any, any],
            pot: 3600,
            currentBet: 0,
            heroPosition: 5,
          },
          river: {
            communityCards: [
              { suit: "spades", rank: "K" },
              { suit: "hearts", rank: "9" },
              { suit: "diamonds", rank: "4" },
              { suit: "clubs", rank: "2" },
              { suit: "spades", rank: "7" },
            ] as [any, any, any, any, any],
            communityCard: { suit: "spades", rank: "7" },
            action: "check",
            betAmount: "0円",
            description:
              "リバーは 7♠。MP がベット、CO がフォールド、私はコール。ショーダウンで、私の JJ が MP の AK を破りました。",
            players: [
              {
                id: "mp",
                name: "MP",
                position: 2,
                stack: 12400,
                bet: 1000,
                action: "bet" as const,
                isActive: true,
              },
              {
                id: "hero",
                name: "Hero (SB)",
                position: 5,
                stack: 11600,
                bet: 1000,
                cards: [
                  { suit: "clubs", rank: "J" },
                  { suit: "diamonds", rank: "J" },
                ] as [any, any],
                isActive: true,
              },
            ],
            communityCards: [
              { suit: "spades", rank: "K" },
              { suit: "hearts", rank: "9" },
              { suit: "diamonds", rank: "4" },
              { suit: "clubs", rank: "2" },
              { suit: "spades", rank: "7" },
            ] as [any, any, any, any, any],
            pot: 5600,
            currentBet: 1000,
            heroPosition: 5,
          },
          reflection: {
            result: "勝ち（+2,600円）",
            thoughts:
              "JJ でのコールド3ベットは標準的なプレイです。フロップでの判断は良かったと思いますが、ターンでのチェックバックについて、もう少し早い段階でバリューを取ることを検討しても良かったかもしれません。",
            seekingAdvice: false,
            postCategory: "ペア",
            visibility: "public" as const,
          },
        },
      ]

      for (const post of samplePosts) {
        try {
          await createPost(post)
          console.log("[v0] サンプル投稿作成:", post.title)
        } catch (error) {
          console.error("[v0] サンプル投稿作成エラー:", error)
        }
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
    return <LoadingScreen />
  }

  if (!currentUserId) {
    return <NotLoggedInScreen />
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <PostHeader
        currentUserName={currentUserName}
        posts={posts}
        isCreatingSamples={isCreatingSamples}
        onCreateSamples={handleCreateSamplePosts}
      />

      <PostList
        posts={posts}
        isCreatingSamples={isCreatingSamples}
        onCreateSamples={handleCreateSamplePosts}
        onDelete={handleDeleteClick}
      />

      <PostDeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        postToDelete={postToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
