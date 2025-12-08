"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PostPreview } from "@/components/post-creation/post-preview"
import { EnhancedCommentSection } from "@/components/posts/enhanced-comment-section"
import { Heart, MessageCircle, Eye, ArrowLeft, Share2 } from "lucide-react"
import type { PostData } from "@/types/post"
import { getPostById } from "@/lib/firestore"

interface PostDetailProps {
  postId: string
  onBack: () => void
  isMemberContext?: boolean
}

export function PostDetail({ postId, onBack, isMemberContext = false }: PostDetailProps) {
  const [post, setPost] = useState<PostData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isAuthor, setIsAuthor] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      console.log("[v0] PostDetail - 投稿取得開始:", postId)
      setIsLoading(true)

      const firestorePost = await getPostById(postId)

      if (firestorePost) {
        setPost(firestorePost)
        setLikeCount(firestorePost.likes || 0)
        const customerAccount = sessionStorage.getItem("customerAccount")
        if (customerAccount) {
          const customer = JSON.parse(customerAccount)
          setIsAuthor(firestorePost.authorId === customer.id)
        }
      } else {
        setPost(null)
      }

      setIsLoading(false)
    }

    fetchPost()
  }, [postId])

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.situation,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
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

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">投稿が見つかりませんでした。</p>
        <Button variant="outline" onClick={onBack}>
          戻る
        </Button>
      </div>
    )
  }

  const formattedDate = new Date(post.createdAt).toLocaleDateString("ja-JP")

  return (
    <div className="space-y-6">
      {/* ナビゲーション */}
      <div>
        <Button variant="ghost" className="flex items-center gap-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          戻る
        </Button>
      </div>

      {/* 投稿ヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl">{post.title}</CardTitle>
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
                <span className="font-medium">{post.authorName}</span>
                <span>{post.storeName}</span>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 統計情報とアクション */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{likeCount}</span>
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
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                className="flex items-center gap-2"
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                {isLiked ? "いいね済み" : "いいね"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2 bg-transparent"
              >
                <Share2 className="w-4 h-4" />
                シェア
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 投稿内容 */}
      <PostPreview postData={post} />

      <EnhancedCommentSection
        postId={post.id}
        isAuthor={isAuthor}
        seekingAdvice={post.seekingAdvice}
        isMemberContext={isMemberContext}
      />
    </div>
  )
}
