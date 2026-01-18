"use client"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, AlertCircle, PlusCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import type { PostData } from "@/types/post"

interface PostHeaderProps {
  currentUserName: string | null
  posts: PostData[]
  isCreatingSamples: boolean
  onCreateSamples: () => void
}

export function PostHeader({
  currentUserName,
  posts,
  isCreatingSamples,
  onCreateSamples,
}: PostHeaderProps) {
  const remainingSlots = 3 - posts.length

  return (
    <>
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
              onClick={onCreateSamples}
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
    </>
  )
}
