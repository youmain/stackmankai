"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, Reply } from "lucide-react"

interface Comment {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: Date
  likes: number
  isLiked?: boolean
  isAdvice?: boolean
  replies?: Comment[]
}

interface CommentSectionProps {
  postId: string
}

// サンプルコメントデータ
const sampleComments: Comment[] = [
  {
    id: "1",
    authorId: "user2",
    authorName: "PokerExpert",
    content:
      "AAでの4bet対応は難しいですね。相手のポジションとスタックサイズを考慮すると、この状況ではオールインが正解だと思います。SBからの4betは通常かなり強いレンジですが、AAなら十分にコールできる強さです。",
    createdAt: new Date("2024-01-15T10:30:00"),
    likes: 5,
    isAdvice: true,
  },
  {
    id: "2",
    authorId: "user3",
    authorName: "CashGamePro",
    content:
      "私も同じような状況を経験したことがあります。結果論ですが、オールインして正解だったと思います。ただ、相手のプレイスタイルも重要な要素ですね。",
    createdAt: new Date("2024-01-15T11:15:00"),
    likes: 3,
    replies: [
      {
        id: "2-1",
        authorId: "user1",
        authorName: "PokerPro123",
        content: "ありがとうございます！相手のスタイルについてもっと観察するべきでした。",
        createdAt: new Date("2024-01-15T11:30:00"),
        likes: 1,
      },
    ],
  },
]

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(sampleComments)
  const [newComment, setNewComment] = useState("")
  const [isAdvice, setIsAdvice] = useState(false)

  const handleSubmitComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      authorId: "current-user",
      authorName: "現在のユーザー",
      content: newComment,
      createdAt: new Date(),
      likes: 0,
      isAdvice,
    }

    setComments([comment, ...comments])
    setNewComment("")
    setIsAdvice(false)
  }

  const handleLikeComment = (commentId: string) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          }
        }
        return comment
      }),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>コメント</span>
          <Badge variant="secondary">{comments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 新しいコメント入力 */}
        <div className="space-y-3">
          <Textarea
            placeholder="コメントを入力してください..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isAdvice}
                onChange={(e) => setIsAdvice(e.target.checked)}
                className="rounded"
              />
              アドバイスとして投稿
            </label>
            <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
              コメントする
            </Button>
          </div>
        </div>

        {/* コメント一覧 */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              まだコメントがありません。最初のコメントを投稿してみましょう！
            </p>
          ) : (
            comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} onLike={() => handleLikeComment(comment.id)} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CommentItem({ comment, onLike }: { comment: Comment; onLike: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.authorName}</span>
            {comment.isAdvice && (
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                アドバイス
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString("ja-JP")}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLike}
              className={`h-auto p-1 text-xs ${comment.isLiked ? "text-red-500" : "text-muted-foreground"}`}
            >
              <Heart className={`w-3 h-3 mr-1 ${comment.isLiked ? "fill-current" : ""}`} />
              {comment.likes}
            </Button>
            <Button variant="ghost" size="sm" className="h-auto p-1 text-xs text-muted-foreground">
              <Reply className="w-3 h-3 mr-1" />
              返信
            </Button>
          </div>
        </div>
      </div>

      {/* 返信 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onLike={() => {}} />
          ))}
        </div>
      )}
    </div>
  )
}
