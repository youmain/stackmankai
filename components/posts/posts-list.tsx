"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PostPreview } from "@/components/post-creation/post-preview"
import { AdvancedFilters, type FilterOptions } from "@/components/posts/advanced-filters"
import { Search, MessageCircle, Heart, Eye } from "lucide-react"
import Link from "next/link"
import type { PostData } from "@/types/post"
import { isFirebaseConfigured } from "@/lib/firebase"
import { subscribeToPost } from "@/lib/firestore"

const samplePosts: PostData[] = [
  // ... サンプルデータは省略（既存のコードと同じ）
]

const availableStores = [
  { id: "store1", name: "東京ポーカークラブ" },
  { id: "store2", name: "大阪ポーカーハウス" },
  { id: "store3", name: "名古屋カジノ" },
  { id: "store4", name: "福岡ポーカールーム" },
]

interface PostsListProps {
  onPostClick?: (postId: string) => void
}

export function PostsList({ onPostClick }: PostsListProps = {}) {
  const [posts, setPosts] = useState<PostData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "most-commented">("newest")

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

  useEffect(() => {
    const loadPosts = async () => {
      try {
        if (!isFirebaseConfigured) {
          setPosts([])
          setIsLoading(false)
          return
        }

        console.log("[v0] 投稿リアルタイム監視開始")
        const unsubscribe = subscribeToPost((firestorePosts) => {
          console.log("[v0] 投稿データ取得:", firestorePosts.length, "件")
          setPosts(firestorePosts)
          setIsLoading(false)
        })

        return unsubscribe
      } catch (error) {
        console.error("投稿データ取得エラー:", error)
        setPosts([])
        setIsLoading(false)
      }
    }

    loadPosts()
  }, [])

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.situation.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesVisibility = filters.visibility.includes(post.visibility as any)
    const matchesAdvice =
      filters.seekingAdvice === null ||
      (filters.seekingAdvice && post.seekingAdvice) ||
      (!filters.seekingAdvice && !post.seekingAdvice)
    const matchesStore = filters.stores.length === 0 || filters.stores.includes(post.storeId || "")
    const matchesLikes = (post.likes || 0) >= filters.minLikes
    const matchesComments = (post.comments || 0) >= filters.minComments

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 検索・フィルター */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="投稿を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

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
      {sortedPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">条件に一致する投稿が見つかりませんでした。</p>
          </CardContent>
        </Card>
      ) : (
        sortedPosts.map((post) => <PostCard key={post.id} post={post} onPostClick={onPostClick} />)
      )}
    </div>
  )
}

function PostCard({ post, onPostClick }: { post: PostData; onPostClick?: (postId: string) => void }) {
  const [showPreview, setShowPreview] = useState(false)

  const handleDetailClick = () => {
    if (onPostClick) {
      onPostClick(post.id)
    }
  }

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
        <p className="text-muted-foreground mb-4 line-clamp-3">{post.situation}</p>

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

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? "プレビューを閉じる" : "プレビューを表示"}
          </Button>
          {onPostClick ? (
            <Button size="sm" variant="secondary" onClick={handleDetailClick}>
              詳細を見る
            </Button>
          ) : (
            <Link href={`/posts/${post.id}`}>
              <Button size="sm" variant="secondary">
                詳細を見る
              </Button>
            </Link>
          )}
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
