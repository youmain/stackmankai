"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PostPreview } from "@/components/post-creation/post-preview"
import { Trash2, Eye, AlertCircle, PlusCircle } from "lucide-react"
import Link from "next/link"
import type { PostData } from "@/types/post"
import { subscribeToUserPosts, deletePost } from "@/lib/firestore"
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

interface MyPostsListProps {
  onPostClick?: (postId: string) => void
}

export function MyPostsList({ onPostClick }: MyPostsListProps) {
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!currentUserId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>ログインが必要です。マイページからログインしてください。</AlertDescription>
      </Alert>
    )
  }

  const remainingSlots = 3 - posts.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">自分の投稿履歴</h2>
          <p className="text-muted-foreground">
            投稿数: {posts.length} / 3件 {remainingSlots > 0 && `（残り${remainingSlots}件投稿可能）`}
          </p>
        </div>
        <Link href="/create-post">
          <Button className="flex items-center gap-2" disabled={posts.length >= 3}>
            <PlusCircle className="w-4 h-4" />
            新規投稿
          </Button>
        </Link>
      </div>

      {posts.length >= 3 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            投稿数の上限（3件）に達しています。新しい投稿を作成するには、既存の投稿を削除してください。
          </AlertDescription>
        </Alert>
      )}

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">まだ投稿がありません。</p>
            <Link href="/create-post">
              <Button className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                最初の投稿を作成
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <MyPostCard key={post.id} post={post} onDelete={handleDeleteClick} onPostClick={onPostClick} />
        ))
      )}

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

function MyPostCard({
  post,
  onDelete,
  onPostClick,
}: { post: PostData; onDelete: (post: PostData) => void; onPostClick?: (postId: string) => void }) {
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
        <p className="text-muted-foreground mb-4 line-clamp-3">{post.situation}</p>
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
