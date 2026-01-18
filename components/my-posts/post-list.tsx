"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import type { PostData } from "@/types/post"
import { MyPostCard } from "./post-card"

interface PostListProps {
  posts: PostData[]
  isCreatingSamples: boolean
  onCreateSamples: () => void
  onDelete: (post: PostData) => void
}

export function PostList({ posts, isCreatingSamples, onCreateSamples, onDelete }: PostListProps) {
  return (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">まだ投稿がありません。</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
                onClick={onCreateSamples}
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
        posts.map((post) => <MyPostCard key={post.id} post={post} onDelete={onDelete} />)
      )}
    </div>
  )
}
