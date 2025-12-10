"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PostPreview } from "@/components/post-creation/post-preview"
import { AdvancedFilters, type FilterOptions } from "@/components/posts/advanced-filters"
import { MembershipGate } from "@/components/membership/membership-gate"
import { useMembership } from "@/hooks/use-membership"
import { Search, MessageCircle, Heart, Eye, Home } from "lucide-react"
import Link from "next/link"
import type { PostData } from "@/types/post"
import { isFirebaseConfigured } from "@/lib/firebase"
import { subscribeToPosts, subscribeToStorePosts } from "@/lib/firestore"

// サンプルデータ
const samplePosts: PostData[] = [
  {
    id: "1",
    title: "AA vs KK オールイン判断について",
    situation:
      "6人テーブル、UTGでAAをもらいました。レイズしたところ、BTNから3©に3bet、さらにSBから24©に4betが入りました。",
    visibility: "public",
    seekingAdvice: true,
    authorId: "user1",
    authorName: "PokerPro123",
    storeId: "store1",
    storeName: "東京ポーカークラブ",
    createdAt: new Date("2024-01-15"),
    likes: 12,
    comments: 8,
    views: 156,
    preflop: {
      situation: "UTGでAAをもらい、3©レイズ。BTNから9©に3bet、SBから24©に4bet。",
      players: [
        {
          id: "hero",
          name: "Hero",
          position: 0,
          stack: 200,
          bet: 0,
          cards: [
            { suit: "spades", rank: "A" },
            { suit: "hearts", rank: "A" },
          ],
          isActive: true,
        },
        { id: "btn", name: "BTN", position: 5, stack: 180, bet: 24, action: "raise" },
        { id: "sb", name: "SB", position: 6, stack: 220, bet: 24, action: "raise" },
      ],
      communityCards: [],
      pot: 51,
      currentBet: 24,
      heroPosition: 0,
      action: "AAでオールインするべきか悩んでいます。相手のレンジを考えると...",
    },
    reflection: {
      result: "勝利",
      thoughts: "結果的にオールインしましたが、相手がKKだったので運良く勝てました。でも判断が正しかったのか不安です。",
      seekingAdvice: true,
      postCategory: "hand-review",
      visibility: "public"
    },
  },
  {
    id: "2",
    title: "フラッシュドローでのセミブラフ - リバーまでの全展開",
    situation:
      "9人テーブルのキャッシュゲーム（1©/2©）。MP1でA♠7♠をもらい、フロップでナッツフラッシュドローになりました。相手の強いベットに対してどう対応するか悩みました。",
    visibility: "store",
    seekingAdvice: true,
    authorId: "user2",
    authorName: "FlushHunter",
    storeId: "store2",
    storeName: "大阪ポーカーハウス",
    createdAt: new Date("2024-01-20"),
    likes: 18,
    comments: 12,
    views: 234,
    preflop: {
      situation: "MP1でA♠7♠をもらい、2.5©にオープンレイズ。BTNがコール、BBもコール。",
      players: [
        {
          id: "hero",
          name: "Hero",
          position: 2,
          stack: 180,
          bet: 2.5,
          cards: [
            { suit: "spades", rank: "A" },
            { suit: "spades", rank: "7" },
          ],
          isActive: true,
        },
        { id: "btn", name: "BTN", position: 5, stack: 220, bet: 2.5, action: "call" },
        { id: "bb", name: "BB", position: 7, stack: 195, bet: 2.5, action: "call" },
      ],
      communityCards: [],
      pot: 7.5,
      currentBet: 2.5,
      heroPosition: 2,
      action: "スーテッドエースなので軽くオープン。マルチウェイになりそうな予感。",
    },
    flop: {
      situation: "フロップ: K♠ 9♠ 4♦。BBチェック、ヒーローベット5©、BTNコール、BBフォールド。",
      players: [
        {
          id: "hero",
          name: "Hero",
          position: 2,
          stack: 172.5,
          bet: 5,
          cards: [
            { suit: "spades", rank: "A" },
            { suit: "spades", rank: "7" },
          ],
          isActive: true,
        },
        { id: "btn", name: "BTN", position: 5, stack: 212.5, bet: 5, action: "call" },
        { id: "bb", name: "BB", position: 7, stack: 192.5, bet: 0, action: "fold" },
      ],
      communityCards: [
        { suit: "spades", rank: "K" },
        { suit: "spades", rank: "9" },
        { suit: "diamonds", rank: "4" },
      ],
      pot: 17.5,
      currentBet: 5,
      heroPosition: 2,
      action: "ナッツフラッシュドロー！Cベットで主導権を取りに行く。",
    },
    turn: {
      situation: "ターン: 2♣。ヒーローベット12©、BTNレイズ35©。",
      players: [
        {
          id: "hero",
          name: "Hero",
          position: 2,
          stack: 160.5,
          bet: 12,
          cards: [
            { suit: "spades", rank: "A" },
            { suit: "spades", rank: "7" },
          ],
          isActive: true,
        },
        { id: "btn", name: "BTN", position: 5, stack: 177.5, bet: 35, action: "raise" },
      ],
      communityCards: [
        { suit: "spades", rank: "K" },
        { suit: "spades", rank: "9" },
        { suit: "diamonds", rank: "4" },
        { suit: "clubs", rank: "2" },
      ],
      pot: 64.5,
      currentBet: 35,
      heroPosition: 2,
      action: "ブランクターン。継続ベットしたら大きくレイズされた。フラッシュドローでコールするべき？",
    },
    river: {
      situation: "リバー: 3♠。フラッシュ完成！ヒーローチェック、BTNベット45©、ヒーローコール。",
      players: [
        {
          id: "hero",
          name: "Hero",
          position: 2,
          stack: 125.5,
          bet: 0,
          cards: [
            { suit: "spades", rank: "A" },
            { suit: "spades", rank: "7" },
          ],
          isActive: true,
        },
        { id: "btn", name: "BTN", position: 5, stack: 142.5, bet: 45, action: "raise" },
      ],
      communityCards: [
        { suit: "spades", rank: "K" },
        { suit: "spades", rank: "9" },
        { suit: "diamonds", rank: "4" },
        { suit: "clubs", rank: "2" },
        { suit: "spades", rank: "3" },
      ],
      pot: 154.5,
      currentBet: 45,
      heroPosition: 2,
      action: "フラッシュ完成！でも相手のベットサイズが気になる。レイズするべきだった？",
    },
    reflection: {
      result: "勝利",
      thoughts: "結果的にナッツフラッシュで勝ちましたが、ターンでのコール判断とリバーでのプレイに疑問が残ります。特にリバーでレイズしなかったのは消極的すぎたかもしれません。皆さんならどうプレイしますか？",
      seekingAdvice: true,
      postCategory: "hand-review",
      visibility: "public"
    },
  },
]

const availableStores = [
  { id: "store1", name: "東京ポーカークラブ" },
  { id: "store2", name: "大阪ポーカーハウス" },
  { id: "store3", name: "名古屋カジノ" },
  { id: "store4", name: "福岡ポーカールーム" },
]

export default function PostsPage() {
  const membershipStatus = useMembership()
  const [posts, setPosts] = useState<PostData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "most-commented">("newest")
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null)

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    visibility: ["public", "store"],
    seekingAdvice: null,
    stores: [],
    dateRange: "all",
    minLikes: 0,
    minComments: 0,
    stages: [],
  })

  // localStorageから店舗情報を取得
  useEffect(() => {
    const storeId = localStorage.getItem("storeId")
    if (storeId) {
      setCurrentStoreId(storeId)
      console.log("🏪 店舗IDをlocalStorageから読み込み:", storeId)
    }
  }, [])

  useEffect(() => {
    const loadPosts = async () => {
      try {
        if (!isFirebaseConfigured) {
          setPosts(samplePosts)
          setIsLoading(false)
          return
        }

        // 店舗IDがあれば店舗フィルタリング、なければ全投稿
        const unsubscribe = currentStoreId
          ? subscribeToStorePosts(currentStoreId, (firestorePosts) => {
              if (firestorePosts.length === 0) {
                setPosts(samplePosts)
              } else {
                setPosts(firestorePosts)
              }
              setIsLoading(false)
            })
          : subscribeToPosts((firestorePosts) => {
              if (firestorePosts.length === 0) {
                setPosts(samplePosts)
              } else {
                setPosts(firestorePosts)
              }
              setIsLoading(false)
            })

        return unsubscribe
      } catch (error) {
        console.error("投稿データ取得エラー:", error)
        setPosts(samplePosts)
        setIsLoading(false)
      }
    }

    loadPosts()
  }, [currentStoreId])

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof post.situation === "string" && post.situation.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesVisibility = filters.visibility.includes(post.visibility as any)

    const matchesAdvice =
      filters.seekingAdvice === null ||
      (filters.seekingAdvice && post.seekingAdvice) ||
      (!filters.seekingAdvice && !post.seekingAdvice)

    const matchesStore = filters.stores.length === 0 || filters.stores.includes(post.storeId || "")

    const matchesLikes = (post.likes || 0) >= filters.minLikes
    const matchesComments = (post.comments || 0) >= filters.minComments

    // 日付フィルター
    const now = new Date()
    const postDate = new Date(post.createdAt)
    let matchesDate = true

    switch (filters.dateRange) {
      case "today":
        matchesDate = postDate.toDateString() === now.toDateString()
        break
      case "week":
        matchesDate = now.getTime() - postDate.getTime() <= 7 * 24 * 60 * 60 * 1000
        break
      case "month":
        matchesDate = now.getTime() - postDate.getTime() <= 30 * 24 * 60 * 60 * 1000
        break
      case "year":
        matchesDate = now.getTime() - postDate.getTime() <= 365 * 24 * 60 * 60 * 1000
        break
    }

    // ステージフィルター
    const matchesStages = filters.stages.length === 0 || filters.stages.some((stage) => post[stage])

    return (
      matchesSearch &&
      matchesVisibility &&
      matchesAdvice &&
      matchesStore &&
      matchesLikes &&
      matchesComments &&
      matchesDate &&
      matchesStages
    )
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return (b.likes || 0) - (a.likes || 0)
      case "most-commented":
        return (b.comments || 0) - (a.comments || 0)
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  if (membershipStatus.isLoading || isLoading) {
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

  const displayPosts = membershipStatus.isMember ? sortedPosts : sortedPosts.slice(0, 5)
  const hasMorePosts = !membershipStatus.isMember && sortedPosts.length > 5

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-4">
        <Link href="/customer-view">
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            マイページに戻る
          </Button>
        </Link>
      </div>

      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">ポーカー投稿</h1>
          <p className="text-muted-foreground">プレイヤーのハンド分析とアドバイス</p>
        </div>
      </div>

      {/* 検索・フィルター */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {/* 検索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="投稿を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* ソート */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="並び順" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">新着順</SelectItem>
                <SelectItem value="popular">人気順</SelectItem>
                <SelectItem value="most-commented">コメント数順</SelectItem>
              </SelectContent>
            </Select>

            <AdvancedFilters
              filters={filters}
              onChange={setFilters}
              availableStores={availableStores}
              isOpen={showAdvancedFilters}
              onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 投稿一覧 */}
      <div className="space-y-6">
        {displayPosts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">条件に一致する投稿が見つかりませんでした。</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {displayPosts.map((post) => (
              <PostCard key={post.id} post={post} isMember={membershipStatus.isMember} />
            ))}

            {hasMorePosts && (
              <MembershipGate
                title="さらに多くの投稿を見る"
                description={`残り${sortedPosts.length - 5}件の投稿があります`}
                featureType="posts"
              >
                <div className="text-center text-sm text-muted-foreground">
                  <p>プロプレイヤーの詳細な分析や</p>
                  <p>高度な戦略解説をご覧いただけます</p>
                </div>
              </MembershipGate>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PostCard({ post, isMember }: { post: PostData; isMember: boolean }) {
  const [showPreview, setShowPreview] = useState(false)

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
              <span>{post.authorName}</span>
              <span>{post.storeName}</span>
              <span>{new Date(post.createdAt).toLocaleDateString("ja-JP")}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 line-clamp-3">
          {typeof post.situation === "string" ? post.situation : post.situation.description || ""}
        </p>

        {/* 統計情報 */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span>{post.likes || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{post.comments || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{post.views || 0}</span>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? "プレビューを閉じる" : "プレビューを表示"}
          </Button>
          <Link href={`/posts/${post.id}`}>
            <Button size="sm">詳細を見る</Button>
          </Link>
        </div>

        {/* プレビュー */}
        {showPreview && (
          <div className="mt-6 border-t pt-6">
            <PostPreview postData={post} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
