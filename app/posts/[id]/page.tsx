"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PostPreview } from "@/components/post-creation/post-preview"
import { EnhancedCommentSection } from "@/components/posts/enhanced-comment-section"
import { MembershipGate } from "@/components/membership/membership-gate"
import { useMembership } from "@/hooks/use-membership"
import { Heart, MessageCircle, Eye, ArrowLeft, Share2, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { PostData } from "@/types/post"
import { getPostById } from "@/lib/firestore"
import { Alert, AlertDescription } from "@/components/ui/alert"

const samplePosts: { [key: string]: PostData } = {
  "1": {
    id: "1",
    title: "AA vs KK オールイン判断について",
    situation:
      "6人テーブルのキャッシュゲーム（SB ©1 / BB ©2）でプレイしていました。\n私のスタックは約200©、相手のスタックも似たような感じでした。\n\nUTGでAAをもらい、どのようにプレイするか悩みました。",
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
      situation: "UTGでAAをもらい、3©にレイズしました。BTNが9©に3bet、SBが24©に4betしてきました。",
      players: [
        {
          id: "hero",
          name: "Hero (UTG)",
          position: 0,
          stack: 200,
          bet: 24,
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
      pot: 75,
      currentBet: 24,
      heroPosition: 0,
      action:
        "AAでオールインするべきか、それとも単にコールするべきか悩んでいます。相手のレンジを考えると、KK+、AKが中心だと思いますが...",
      holeCards: [
        { suit: "spades", rank: "A" },
        { suit: "hearts", rank: "A" },
      ],
      betAmount: "24",
      description: "UTGでAAをもらい、3©にレイズ。BTNが9©に3bet、SBが24©に4betしてきました。",
    },
    flop: {
      situation: "結局オールインを選択し、BTNはフォールド、SBがコールしてきました。",
      players: [
        {
          id: "hero",
          name: "Hero (UTG)",
          position: 0,
          stack: 0,
          bet: 200,
          cards: [
            { suit: "spades", rank: "A" },
            { suit: "hearts", rank: "A" },
          ],
          isActive: true,
          action: "all-in",
        },
        { id: "sb", name: "SB", position: 6, stack: 20, bet: 200, action: "call" },
      ],
      communityCards: [
        { suit: "hearts", rank: "K" },
        { suit: "diamonds", rank: "7" },
        { suit: "clubs", rank: "2" },
      ],
      pot: 400,
      currentBet: 200,
      heroPosition: 0,
      action: "フロップでKが出てしまい、相手がKKを持っていたら負けてしまいます。",
      betAmount: "200",
      description: "オールインを選択。BTNフォールド、SBコール。フロップでKが出ました。",
    },
    turn: {
      communityCard: { suit: "spades", rank: "4" },
      action: "all-in",
      betAmount: "200",
      description: "ターンは4♠。まだ相手のハンドは分からず、ドキドキしながらリバーを待ちます。",
    },
    river: {
      communityCard: { suit: "hearts", rank: "9" },
      action: "all-in",
      betAmount: "200",
      description: "リバーは9♥。相手はKKを持っていましたが、私のAAが勝利しました！",
    },
    reflection: {
      result: "勝利 - AAがKKに勝利し、約400©のポットを獲得",
      thoughts:
        "結果的にオールインして勝つことができましたが、判断が正しかったのか不安です。\n\n相手のレンジを考えると、KK+、AKが中心だと思いましたが、AAに対してKKでオールインコールするのは正しい判断だったのでしょうか？\n\n私としては、プリフロップでAAを持っている時の4bet以降のプレイについて、もっと学びたいと思います。特に、マルチウェイでの4betに対する最適な対応について知りたいです。\n\nアドバイスをいただけると嬉しいです！",
      seekingAdvice: true,
      postCategory: "プリフロップ戦略",
      visibility: "public",
    },
  },
  "2": {
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
      holeCards: [
        { suit: "spades", rank: "A" },
        { suit: "spades", rank: "7" },
      ],
      betAmount: "2.5",
      description: "MP1でA♠7♠をもらい、2.5©にオープンレイズ。BTNとBBがコール。",
    },
    flop: {
      communityCards: [
        { suit: "spades", rank: "K" },
        { suit: "spades", rank: "9" },
        { suit: "diamonds", rank: "4" },
      ],
      action: "bet",
      betAmount: "5",
      description: "ナッツフラッシュドロー！BBチェック、ヒーローベット5©、BTNコール、BBフォールド。",
    },
    turn: {
      communityCard: { suit: "clubs", rank: "2" },
      action: "call",
      betAmount: "35",
      description: "ブランクターン。ヒーローベット12©、BTNレイズ35©。フラッシュドローでコール。",
    },
    river: {
      communityCard: { suit: "spades", rank: "3" },
      action: "call",
      betAmount: "45",
      description: "フラッシュ完成！ヒーローチェック、BTNベット45©、ヒーローコール。",
    },
    reflection: {
      result: "勝利 - ナッツフラッシュで約154©のポットを獲得",
      thoughts:
        "結果的にナッツフラッシュで勝ちましたが、プレイに疑問が残ります。\n\nまず、ターンでのコール判断について。相手の大きなレイズに対して、フラッシュドローだけでコールするのは正しかったのでしょうか？ポットオッズ的には合っていたと思いますが、インプライドオッズも考慮すべきでした。\n\n次に、リバーでのプレイ。フラッシュが完成したのにチェックしてしまい、相手のベットに対してコールだけしました。ここでレイズしなかったのは消極的すぎたかもしれません。相手がKのトップペアやツーペアを持っていた場合、レイズに対してもコールしてくれた可能性が高いです。\n\nより攻撃的にプレイすべきだったと反省しています。皆さんならどうプレイしますか？",
      seekingAdvice: true,
      postCategory: "ドロー戦略",
      visibility: "store",
    },
  },
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isMember, isLoading: membershipLoading } = useMembership()
  const [post, setPost] = useState<PostData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isAuthor, setIsAuthor] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const postId = params.id as string

  const fetchPost = async () => {
    console.log("[v0] fetchPost 呼び出し - postId:", postId)

    setIsLoading(true)

    const firestorePost = await getPostById(postId)

    if (firestorePost) {
      console.log("[v0] 📝 投稿データ全体:", JSON.stringify(firestorePost, null, 2))
      console.log("[v0] 📝 投稿データ取得成功")
      console.log("[v0] 📝 投稿ID:", firestorePost.id)
      console.log("[v0] 📝 投稿タイトル:", firestorePost.title)
      console.log("[v0] 📝 投稿作成者ID:", firestorePost.authorId)
      console.log("[v0] 📝 投稿作成者名:", firestorePost.authorName)

      setPost(firestorePost)
      setLikeCount(firestorePost.likes || 0)
      setIsAuthor(firestorePost.authorId === "user1")
    } else {
      const foundPost = samplePosts[postId]
      if (foundPost) {
        setPost(foundPost)
        setLikeCount(foundPost.likes || 0)
        setIsAuthor(foundPost.authorId === "user1")
      } else {
        setPost(null)
      }
    }

    setIsLoading(false)
  }

  useEffect(() => {
    console.log("[v0] useEffect 実行 - postId:", postId)
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
        text: typeof post?.situation === "string" ? post?.situation : post?.situation?.description || "",
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (postId === "create" || postId === "new") {
    if (!isRedirecting) {
      setIsRedirecting(true)
      router.push("/create-post")
    }

    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            投稿作成ページにリダイレクトしています...
            <br />
            自動的に移動しない場合は、
            <Link href="/create-post" className="text-primary underline ml-1">
              こちらをクリック
            </Link>
            してください。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const formattedDate = post && post.createdAt
    ? (() => {
        try {
          // Firestore Timestampオブジェクトの場合
          if (post.createdAt && typeof post.createdAt === 'object' && 'toDate' in post.createdAt) {
            return post.createdAt.toDate().toLocaleDateString("ja-JP")
          }
          // Date型の場合
          if (post.createdAt instanceof Date) {
            return post.createdAt.toLocaleDateString("ja-JP")
          }
          // 文字列やnumberの場合
          return new Date(post.createdAt).toLocaleDateString("ja-JP")
        } catch (error) {
          console.error("日付のフォーマットエラー:", error)
          return "日付不明"
        }
      })()
    : ""

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">投稿が見つかりませんでした。</p>
          <Link href="/posts">
            <Button variant="outline">投稿一覧に戻る</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* ナビゲーション */}
      <div className="mb-6">
        <Link href="/posts">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            投稿一覧に戻る
          </Button>
        </Link>
      </div>

      {/* 投稿ヘッダー */}
      <Card className="mb-6">
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
                disabled={!isMember}
                className="flex items-center gap-2"
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                {isMember ? (isLiked ? "いいね済み" : "いいね") : "いいね（会員限定）"}
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
      <PostPreview postData={post} className="mb-6" />

      {/* コメントセクション */}
      {isMember ? (
        <EnhancedCommentSection
          postId={post.id}
          isAuthor={isAuthor}
          seekingAdvice={post.seekingAdvice}
          postAuthorId={post.authorId}
        />
      ) : (
        <MembershipGate
          title="コメント・アドバイスを見る"
          description="この投稿には貴重なコメントやアドバイスが投稿されています"
          featureType="comments"
        >
          <div className="bg-white/60 p-4 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">コメントは有料会員のみ見ることができます</p>
              <p className="text-sm mt-1">プロからの詳細なアドバイスや分析をご覧いただけます</p>
            </div>
          </div>
        </MembershipGate>
      )}
    </div>
  )
}
