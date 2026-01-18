"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Trash2 } from "lucide-react"
import Link from "next/link"
import type { PostData } from "@/types/post"
import { PostPreview } from "@/components/post-creation/post-preview"

interface MyPostCardProps {
  post: PostData
  onDelete: (post: PostData) => void
}

export function MyPostCard({ post, onDelete }: MyPostCardProps) {
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
