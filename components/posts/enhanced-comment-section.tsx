"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { MembershipGate } from "@/components/membership/membership-gate"
import { useMembership } from "@/hooks/use-membership"
import { useAuth } from "@/contexts/auth-context"
import { Reply, Star, Award, CheckCircle, ThumbsUp, ThumbsDown, Trash2, Lock } from "lucide-react"
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore"
import { getDb } from "@/lib/firebase"

interface Comment {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: Date
  likes: number
  dislikes: number
  isLiked?: boolean
  isDisliked?: boolean
  isAdvice?: boolean
  isBestAnswer?: boolean
  adviceRating?: number
  adviceVotes?: number
  authorLevel?: "beginner" | "intermediate" | "advanced" | "expert"
  authorBadges?: string[]
  replies?: Comment[]
  isAIComment?: boolean
}

interface EnhancedCommentSectionProps {
  postId: string
  isAuthor?: boolean
  seekingAdvice?: boolean
  isMemberContext?: boolean
  postAuthorId?: string
}

function getSampleCommentsForPost(postId: string): Comment[] {
  const commentSets: { [key: string]: Comment[] } = {
    default_aa_kk: [
      {
        id: "1",
        authorId: "user2",
        authorName: "PokerExpert",
        content:
          "AAでの4bet対応は難しいですね。相手のポジションとスタックサイズを考慮すると、この状況ではオールインが正解だと思います。\n\n理由：\n1. AAは最強のスターティングハンド\n2. SBからの4betは通常QQ+、AKのレンジ\n3. 有効スタックが100BB以下なら迷わずオールイン\n\n相手がKKを持っていても80%の勝率があります。",
        createdAt: new Date("2024-01-15T10:30:00"),
        likes: 8,
        dislikes: 1,
        isAdvice: true,
        isBestAnswer: true,
        adviceRating: 4.5,
        adviceVotes: 6,
        authorLevel: "expert",
        authorBadges: ["認定プロ", "トーナメント優勝"],
      },
      {
        id: "2",
        authorId: "user4",
        authorName: "BeginnerPlayer",
        content: "勉強になります！私だったらビビってフォールドしてしまいそうです...",
        createdAt: new Date("2024-01-15T11:15:00"),
        likes: 3,
        dislikes: 0,
        authorLevel: "beginner",
      },
      {
        id: "3",
        authorId: "user3",
        authorName: "CashGamePro",
        content:
          "私も同じような状況を経験したことがあります。ただし、相手のプレイスタイルも重要な要素ですね。\n\nタイトなプレイヤーからの4betなら、より慎重になる必要があります。でも一般的にはオールインが正解だと思います。",
        createdAt: new Date("2024-01-15T12:00:00"),
        likes: 5,
        dislikes: 0,
        isAdvice: true,
        isBestAnswer: true,
        adviceRating: 4.0,
        adviceVotes: 3,
        authorLevel: "advanced",
        authorBadges: ["キャッシュゲーム専門", "アドバイス"],
        replies: [
          {
            id: "3-1",
            authorId: "user1",
            authorName: "PokerPro123",
            content: "ありがとうございます！相手のスタイルについてもっと観察するべきでした。",
            createdAt: new Date("2024-01-15T12:15:00"),
            likes: 2,
            dislikes: 0,
            authorLevel: "intermediate",
          },
        ],
      },
    ],
    default_flush: [
      {
        id: "1",
        authorId: "user5",
        authorName: "DrawMaster",
        content:
          "フラッシュドローでのセミブラフは良いプレイですね。ただし、ターンでフラッシュが完成した時のベットサイジングについて考えてみましょう。\n\n理由：\n1. フラッシュ完成時は相手のレンジを考慮\n2. 小さいベットでバリューを取る方が良い場合もある\n3. 相手のスタックサイズとポットサイズのバランスが重要\n\nこの状況では、ポットの50-60%のベットが最適だったかもしれません。",
        createdAt: new Date("2024-01-20T10:00:00"),
        likes: 6,
        dislikes: 0,
        isAdvice: true,
        isBestAnswer: true,
        adviceRating: 4.3,
        adviceVotes: 5,
        authorLevel: "expert",
        authorBadges: ["ドロー専門家"],
      },
      {
        id: "2",
        authorId: "user6",
        authorName: "TournamentPro",
        content: "フラッシュが完成した時のプレイは難しいですね。相手のハンドリーディングが重要です。",
        createdAt: new Date("2024-01-20T11:30:00"),
        likes: 4,
        dislikes: 0,
        isAdvice: true,
        adviceRating: 3.8,
        adviceVotes: 2,
        authorLevel: "advanced",
        authorBadges: ["トーナメント専門"],
      },
      {
        id: "3",
        authorId: "user7",
        authorName: "CashPlayer",
        content: "私もよくフラッシュドローでプレイします。参考になりました！",
        createdAt: new Date("2024-01-20T13:00:00"),
        likes: 2,
        dislikes: 0,
        authorLevel: "intermediate",
      },
    ],
    default_multiway: [
      {
        id: "1",
        authorId: "user8",
        authorName: "MultiWayExpert",
        content:
          "マルチウェイポットでのAKsのプレイは非常に難しいですね。プリフロップでの3betについて考えてみましょう。\n\n理由：\n1. AKsは強いハンドだが、マルチウェイでは価値が下がる\n2. UTGとMPのレンジを考慮すると、3betは正しい選択\n3. ただし、ベットサイジングを大きくしてマルチウェイを避ける方が良かったかも\n\nフロップでトップツーペアを作った時のベットサイジングは良かったと思います。",
        createdAt: new Date("2024-01-25T09:00:00"),
        likes: 10,
        dislikes: 0,
        isAdvice: true,
        isBestAnswer: true,
        adviceRating: 4.7,
        adviceVotes: 8,
        authorLevel: "expert",
        authorBadges: ["マルチウェイ専門家", "認定プロ"],
      },
      {
        id: "2",
        authorId: "user9",
        authorName: "PositionPlayer",
        content:
          "BTNからの3betは良いプレイだと思います。ポジションアドバンテージを活かせますね。\n\nただし、マルチウェイになった時のプレイプランを事前に考えておくことが重要です。",
        createdAt: new Date("2024-01-25T10:30:00"),
        likes: 7,
        dislikes: 0,
        isAdvice: true,
        adviceRating: 4.2,
        adviceVotes: 4,
        authorLevel: "advanced",
        authorBadges: ["ポジション戦略"],
      },
      {
        id: "3",
        authorId: "user10",
        authorName: "StudyPlayer",
        content: "マルチウェイポットの勉強になります。私もBTNでのプレイを改善したいです。",
        createdAt: new Date("2024-01-25T12:00:00"),
        likes: 3,
        dislikes: 0,
        authorLevel: "intermediate",
      },
      {
        id: "4",
        authorId: "user11",
        authorName: "RangeAnalyst",
        content:
          "UTGとMPのレンジを考えると、3betは正しいですね。ただし、フロップでのベットサイジングをもっと大きくしても良かったかもしれません。",
        createdAt: new Date("2024-01-25T14:00:00"),
        likes: 5,
        dislikes: 0,
        isAdvice: true,
        adviceRating: 4.0,
        adviceVotes: 3,
        authorLevel: "advanced",
        authorBadges: ["レンジ分析"],
      },
    ],
  }

  if (postId.includes("AA") || postId.includes("KK") || postId.includes("680K")) {
    return commentSets.default_aa_kk
  } else if (postId.includes("フラッシュ") || postId.includes("77Ac")) {
    return commentSets.default_flush
  } else if (postId.includes("マルチ") || postId.includes("AKs") || postId.includes("fcJi")) {
    return commentSets.default_multiway
  }

  return []
}

export function EnhancedCommentSection({
  postId,
  isAuthor = false,
  seekingAdvice = false,
  isMemberContext = false,
  postAuthorId,
}: EnhancedCommentSectionProps) {
  const membershipStatus = useMembership()
  const { customerAccount } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [commentType, setCommentType] = useState<"comment" | "advice">("comment")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most-liked" | "best-advice">("newest")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("[v0] 🔍 EnhancedCommentSection - マウント開始")
    console.log("[v0] 📝 投稿ID:", postId)
    console.log("[v0] 👤 会員ステータス:", membershipStatus.isMember)
    const db = getDb()
    console.log("[v0] 📚 Firestoreインスタンス:", !!db)

    if (!db) {
      console.error("[v0] ❌ Firestoreインスタンスが存在しません")
      setLoading(false)
      return
    }

    try {
      const commentsRef = collection(db, "comments")
      console.log("[v0] 📂 コレクション参照作成成功")

      const commentsQuery = query(commentsRef, where("postId", "==", postId))
      console.log("[v0] 🔎 クエリ作成成功")

      const unsubscribe = onSnapshot(
        commentsQuery,
        (snapshot) => {
          console.log("[v0] 📥 スナップショット受信 - ドキュメント数:", snapshot.docs.length)

          const fetchedComments = snapshot.docs.map((doc) => {
            const data = doc.data()
            console.log("[v0] 📄 コメントデータ:", {
              id: doc.id,
              authorName: data.authorName || data.aiPlayerName,
              isAIComment: data.isAIComment,
              content: data.content?.substring(0, 50),
            })

            return {
              id: doc.id,
              authorId: data.authorId || data.aiPlayerId || "unknown",
              authorName: data.authorName || data.aiPlayerName || "匿名",
              content: data.content || "",
              createdAt: data.createdAt?.toDate() || new Date(),
              likes: data.likes || 0,
              dislikes: data.dislikes || 0,
              isAdvice: data.isAdvice || false,
              isBestAnswer: data.isBestAnswer || false,
              adviceRating: data.adviceRating,
              adviceVotes: data.adviceVotes,
              authorLevel: data.authorLevel || "intermediate",
              authorBadges: data.authorBadges || [],
              replies: data.replies || [],
              isAIComment: data.isAIComment || false,
            } as Comment
          })

          fetchedComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

          console.log("[v0] ✅ コメント取得完了 - 合計:", fetchedComments.length)
          setComments(fetchedComments)
          setLoading(false)
        },
        (error) => {
          console.error("[v0] ❌ コメント取得エラー:", error)
          console.error("[v0] ❌ エラー詳細:", error.message)
          console.error("[v0] ❌ エラーコード:", error.code)
          setLoading(false)
        },
      )

      return () => {
        console.log("[v0] 🔌 コメントリスナー解除")
        unsubscribe()
      }
    } catch (error) {
      console.error("[v0] ❌ クエリ作成エラー:", error)
      setLoading(false)
    }
  }, [postId, membershipStatus.isMember])

  const handleSubmitComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      authorId: "current-user",
      authorName: "現在のユーザー",
      content: newComment,
      createdAt: new Date(),
      likes: 0,
      dislikes: 0,
      isAdvice: commentType === "advice",
      authorLevel: "intermediate",
    }

    setComments([comment, ...comments])
    setNewComment("")
    setCommentType("comment")
  }

  const handleLikeComment = (commentId: string) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          const wasLiked = comment.isLiked
          return {
            ...comment,
            isLiked: !wasLiked,
            isDisliked: false,
            likes: wasLiked ? comment.likes - 1 : comment.likes + 1,
            dislikes: comment.isDisliked ? comment.dislikes - 1 : comment.dislikes,
          }
        }
        return comment
      }),
    )
  }

  const handleDislikeComment = (commentId: string) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          const wasDisliked = comment.isDisliked
          return {
            ...comment,
            isDisliked: !wasDisliked,
            isLiked: false,
            dislikes: wasDisliked ? comment.dislikes - 1 : comment.dislikes + 1,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes,
          }
        }
        return comment
      }),
    )
  }

  const handleMarkBestAnswer = (commentId: string) => {
    if (!isAuthor) return

    setComments(
      comments.map((comment) => ({
        ...comment,
        isBestAnswer: comment.id === commentId ? !comment.isBestAnswer : false,
      })),
    )
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("このコメントを削除してもよろしいですか？")) {
      return
    }

    try {
      if (db) {
        await deleteDoc(doc(db, "comments", commentId))
      }
      console.log("[v0] ✅ コメント削除成功:", commentId)
    } catch (error: any) {
      console.error("[v0] ❌ コメント削除エラー:", error)
      if (error.code === "permission-denied") {
        alert("このコメントを削除する権限がありません")
      } else {
        alert("コメントの削除に失敗しました")
      }
    }
  }

  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "most-liked":
        return b.likes - b.dislikes - (a.likes - a.dislikes)
      case "best-advice":
        if (a.isAdvice && b.isAdvice) {
          return (b.adviceRating || 0) - (a.adviceRating || 0)
        }
        if (a.isAdvice && !b.isAdvice) return -1
        if (!a.isAdvice && b.isAdvice) return 1
        return b.likes - b.dislikes - (a.likes - a.dislikes)
      case "newest":
      default:
        if (a.isBestAnswer && !b.isBestAnswer) return -1
        if (!a.isBestAnswer && b.isBestAnswer) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const adviceComments = comments.filter((c) => c.isAdvice)
  const regularComments = comments.filter((c) => !c.isAdvice)

  if (!isMemberContext && !membershipStatus.isMember) {
    return (
      <MembershipGate
        title="コメント・アドバイス機能"
        description="プロプレイヤーからの貴重なアドバイスや詳細な分析をご覧いただけます"
        featureType="comments"
      >
        <div className="bg-white/60 p-4 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center text-muted-foreground space-y-3">
            <Lock className="w-8 h-8 mx-auto opacity-50" />
            <div>
              <p className="font-medium">コメントは有料会員のみ見ることができます</p>
              <p className="text-sm mt-1">この投稿には{comments.length}件のコメントがあります</p>
            </div>
            <div className="text-xs space-y-1">
              <p>• プロプレイヤーからの詳細なアドバイス</p>
              <p>• 戦略的な分析とフィードバック</p>
              <p>• コミュニティとの活発な議論</p>
            </div>
          </div>
        </div>
      </MembershipGate>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>コメント・アドバイス</span>
            <Badge variant="secondary">{comments.length}</Badge>
            {seekingAdvice && adviceComments.length > 0 && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                アドバイス {adviceComments.length}件
              </Badge>
            )}
          </CardTitle>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">新着順</SelectItem>
              <SelectItem value="oldest">古い順</SelectItem>
              <SelectItem value="most-liked">評価順</SelectItem>
              {seekingAdvice && <SelectItem value="best-advice">アドバイス順</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={commentType === "comment" ? "default" : "outline"}
              size="sm"
              onClick={() => setCommentType("comment")}
            >
              コメント
            </Button>
            <Button
              variant={commentType === "advice" ? "default" : "outline"}
              size="sm"
              onClick={() => setCommentType("advice")}
            >
              アドバイス
            </Button>
          </div>

          <Textarea
            placeholder={
              commentType === "advice"
                ? "具体的なアドバイスを入力してください（理由や根拠も含めて）..."
                : "コメントを入力してください..."
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={commentType === "advice" ? 4 : 3}
          />

          {commentType === "advice" && (
            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">良いアドバイスのポイント：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>具体的な理由や根拠を示す</li>
                <li>代替案があれば提示する</li>
                <li>相手のレベルに合わせた説明をする</li>
              </ul>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
              {commentType === "advice" ? "アドバイスする" : "コメントする"}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">コメントを読み込んでいます...</p>
          ) : sortedComments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              まだコメントがありません。最初のコメントを投稿してみましょう！
            </p>
          ) : (
            sortedComments.map((comment) => (
              <EnhancedCommentItem
                key={comment.id}
                comment={comment}
                onLike={() => handleLikeComment(comment.id)}
                onDislike={() => handleDislikeComment(comment.id)}
                onMarkBestAnswer={() => handleMarkBestAnswer(comment.id)}
                onDelete={() => handleDeleteComment(comment.id)}
                canMarkBestAnswer={isAuthor && comment.isAdvice && seekingAdvice}
                currentUserId={customerAccount?.id}
                postAuthorId={postAuthorId}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EnhancedCommentItem({
  comment,
  onLike,
  onDislike,
  onMarkBestAnswer,
  onDelete,
  canMarkBestAnswer,
  currentUserId,
  postAuthorId,
}: {
  comment: Comment
  onLike: () => void
  onDislike: () => void
  onMarkBestAnswer: () => void
  onDelete: () => void
  canMarkBestAnswer?: boolean
  currentUserId?: string
  postAuthorId?: string
}) {
  const getLevelColor = (level?: string) => {
    switch (level) {
      case "expert":
        return "text-purple-600"
      case "advanced":
        return "text-blue-600"
      case "intermediate":
        return "text-green-600"
      case "beginner":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  const getLevelLabel = (level?: string) => {
    switch (level) {
      case "expert":
        return "エキスパート"
      case "advanced":
        return "上級者"
      case "intermediate":
        return "中級者"
      case "beginner":
        return "初心者"
      default:
        return ""
    }
  }

  const canDelete =
    currentUserId &&
    (comment.authorId === currentUserId || // コメント投稿者本人
      postAuthorId === currentUserId || // 投稿作成者
      comment.isAIComment) // AIコメント

  console.log("[v0] 🔐 削除権限チェック - コメントID:", comment.id)
  console.log("[v0] 🔐 削除権限チェック - コメント投稿者ID:", comment.authorId)
  console.log("[v0] 🔐 削除権限チェック - 現在のユーザーID:", currentUserId)
  console.log("[v0] 🔐 削除権限チェック - 投稿作成者ID:", postAuthorId)
  console.log("[v0] 🔐 削除権限チェック - 削除可能:", canDelete)

  return (
    <div className={`space-y-3 ${comment.isBestAnswer ? "bg-green-50 p-4 rounded-lg border-2 border-green-200" : ""}`}>
      <div className="flex gap-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className={getLevelColor(comment.authorLevel)}>{comment.authorName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">
              {comment.authorName}
              {comment.isAIComment && <span className="text-blue-600 font-normal ml-1">(AI)</span>}
            </span>

            {comment.authorLevel && (
              <Badge variant="outline" className={`text-xs ${getLevelColor(comment.authorLevel)}`}>
                {getLevelLabel(comment.authorLevel)}
              </Badge>
            )}

            {comment.authorBadges?.map((badge) => (
              <Badge key={badge} variant="secondary" className="text-xs">
                {badge}
              </Badge>
            ))}

            {comment.isAdvice && (
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                アドバイス
              </Badge>
            )}

            {comment.isBestAnswer && (
              <Badge className="text-xs bg-green-600">
                <Award className="w-3 h-3 mr-1" />
                ベストアンサー
              </Badge>
            )}

            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString("ja-JP")}
            </span>
          </div>

          {comment.isAdvice && comment.adviceRating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(comment.adviceRating!) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {comment.adviceRating.toFixed(1)} ({comment.adviceVotes}票)
              </span>
            </div>
          )}

          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLike}
              className={`h-auto p-1 text-xs ${comment.isLiked ? "text-red-500" : "text-muted-foreground"}`}
            >
              <ThumbsUp className={`w-3 h-3 mr-1 ${comment.isLiked ? "fill-current" : ""}`} />
              {comment.likes}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onDislike}
              className={`h-auto p-1 text-xs ${comment.isDisliked ? "text-blue-500" : "text-muted-foreground"}`}
            >
              <ThumbsDown className={`w-3 h-3 mr-1 ${comment.isDisliked ? "fill-current" : ""}`} />
              {comment.dislikes}
            </Button>

            <Button variant="ghost" size="sm" className="h-auto p-1 text-xs text-muted-foreground">
              <Reply className="w-3 h-3 mr-1" />
              返信
            </Button>

            {canMarkBestAnswer && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkBestAnswer}
                className={`h-auto p-1 text-xs ${comment.isBestAnswer ? "text-green-600" : "text-muted-foreground"}`}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                {comment.isBestAnswer ? "ベストアンサー解除" : "ベストアンサーに選ぶ"}
              </Button>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-auto p-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                削除
              </Button>
            )}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-13 space-y-3">
          {comment.replies.map((reply) => (
            <EnhancedCommentItem
              key={reply.id}
              comment={reply}
              onLike={() => {}}
              onDislike={() => {}}
              onMarkBestAnswer={() => {}}
              onDelete={() => {}}
              canMarkBestAnswer={false}
              currentUserId={currentUserId}
              postAuthorId={postAuthorId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
